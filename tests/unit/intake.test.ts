import { describe, expect, it } from "vitest";
import { TEST_CARD_DECLINED, TEST_CARD_OK, formatCardNumber, formatExpiry, luhnValid, validateCard } from "@/lib/domain/card";
import { COUNTIES, countyForZip, searchCounties, suggestCounties } from "@/lib/domain/counties";
import { suggestEmailCorrection } from "@/lib/domain/email-typo";
import {
  emptyIntakeForm,
  fromNavIndex,
  keyForStep,
  stepForKey,
  toNavStep,
  visibleSteps,
  type IntakeFormData,
} from "@/lib/domain/intake";
import { buildCaseFromIntake, nextReference } from "@/lib/domain/intake-case";
import {
  MAX_CLAIM_WORDS,
  validateClaim,
  validateClaimant,
  validateDefendant,
  validateFilingCourt,
} from "@/lib/domain/intake-validation";
import { CERTIFIED_MAIL_UPSELL_CENTS, DEMAND_LETTER_PRICE_CENTS, computeQuote, isValidCoupon } from "@/lib/domain/pricing";
import { safeNextPath } from "@/lib/data/session";
import { NOW, seed } from "./helpers";

const sc = (patch: Partial<IntakeFormData> = {}): IntakeFormData => ({
  ...emptyIntakeForm("small_claims", seed.profile),
  defendantLegalName: "Acme LLC",
  defendantAddress: "1 Main St",
  defendantCity: "Sacramento",
  defendantState: "CA",
  defendantZip: "95814",
  countyId: "sacramento-ca",
  countyName: "Sacramento County, CA",
  countyState: "CA",
  claimCategories: ["Broken contract"],
  incidentDate: "2026-09-01",
  claimAmount: "1500",
  claimDescription: "They took my money and did nothing.",
  hasEvidenceToUpload: false,
  mailingPref: "certified",
  ...patch,
});

const ah = (patch: Partial<IntakeFormData> = {}): IntakeFormData => ({
  ...emptyIntakeForm("activation_hero", seed.profile),
  platformId: "doordash",
  platformName: "DoorDash, Inc.",
  platformAccountEmail: seed.profile.email,
  countyId: "sacramento-ca",
  claimCategories: ["No reason given"],
  incidentDate: "2026-09-01",
  claimAmount: "3000",
  claimDescription: "Deactivated with no reason.",
  hasEvidenceToUpload: true,
  mailingPref: "first_class",
  ...patch,
});

describe("claimant validation", () => {
  it("accepts the prefilled demo profile", () => {
    expect(validateClaimant(emptyIntakeForm("small_claims", seed.profile))).toEqual({});
  });

  it("flags an empty form field by field", () => {
    const errors = validateClaimant(emptyIntakeForm("small_claims"));
    expect(Object.keys(errors).sort()).toEqual(["claimantAddress", "claimantCity", "claimantEmail", "claimantName", "claimantPhone", "claimantState", "claimantZip"]);
  });

  it("checks email, phone, ZIP and state formats; non-US skips the US rules", () => {
    const bad = { ...emptyIntakeForm("small_claims", seed.profile), claimantEmail: "nope", claimantPhone: "12", claimantZip: "1234", claimantState: "California" };
    expect(Object.keys(validateClaimant(bad)).sort()).toEqual(["claimantEmail", "claimantPhone", "claimantState", "claimantZip"]);
    const uk = { ...emptyIntakeForm("small_claims", seed.profile), claimantCountry: "GB", claimantState: "Greater London", claimantZip: "SW1A 1AA" };
    expect(validateClaimant(uk)).toEqual({});
    expect(validateClaimant({ ...uk, claimantCountry: "UK1" })).toHaveProperty("claimantCountry");
  });
});

describe("defendant validation", () => {
  it("requires a name and address for small claims, but not when an existing business is picked", () => {
    expect(Object.keys(validateDefendant(emptyIntakeForm("small_claims"))).sort()).toEqual(["defendantAddress", "defendantCity", "defendantLegalName", "defendantState", "defendantZip"]);
    expect(validateDefendant(sc({ defendantExistingBusinessId: "biz-1", defendantAddress: "", defendantCity: "", defendantState: "", defendantZip: "" }))).toEqual({});
  });

  it("validates optional defendant email / phone only when present", () => {
    expect(validateDefendant(sc())).toEqual({});
    expect(Object.keys(validateDefendant(sc({ defendantEmail: "x", defendantPhone: "1" })))).toEqual(["defendantEmail", "defendantPhone"]);
  });

  it("Activation Hero needs a platform and an account email or phone", () => {
    expect(Object.keys(validateDefendant(emptyIntakeForm("activation_hero")))).toEqual(["platformName", "platformAccountEmail"]);
    expect(validateDefendant(ah())).toEqual({});
    expect(validateDefendant(ah({ platformAccountEmail: "", platformAccountPhone: "5555550100" }))).toEqual({});
    expect(validateDefendant(ah({ platformAccountEmail: "bad" }))).toHaveProperty("platformAccountEmail");
  });
});

describe("claim validation", () => {
  it("accepts a complete claim", () => {
    expect(validateClaim(sc(), NOW)).toEqual({});
    expect(validateClaim(ah(), NOW)).toEqual({});
  });

  it("enforces the small-claims cap but not for Activation Hero lost earnings", () => {
    expect(validateClaim(sc({ claimAmount: "25000.01" }), NOW)).toHaveProperty("claimAmount");
    expect(validateClaim(sc({ claimAmount: "25000" }), NOW)).toEqual({});
    expect(validateClaim(ah({ claimAmount: "90000" }), NOW)).toEqual({});
    expect(validateClaim(sc({ claimAmount: "0" }), NOW)).toHaveProperty("claimAmount");
  });

  it("rejects future dates and missing selections", () => {
    expect(validateClaim(sc({ incidentDate: "2026-12-01" }), NOW)).toHaveProperty("incidentDate");
    const errors = validateClaim(sc({ claimCategories: [], hasEvidenceToUpload: null, mailingPref: null, incidentDate: "" }), NOW);
    expect(Object.keys(errors).sort()).toEqual(["claimCategories", "hasEvidenceToUpload", "incidentDate", "mailingPref"]);
  });

  it("limits the description to 100 words", () => {
    const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
    expect(validateClaim(sc({ claimDescription: words(MAX_CLAIM_WORDS) }), NOW)).toEqual({});
    expect(validateClaim(sc({ claimDescription: words(MAX_CLAIM_WORDS + 1) }), NOW).claimDescription).toMatch(/at most 100 words/);
  });

  it("filing court needs a county", () => {
    expect(validateFilingCourt(sc({ countyId: "" }))).toHaveProperty("countyId");
    expect(validateFilingCourt(sc())).toEqual({});
  });
});

describe("step mapping", () => {
  it("Small Claims shows six stepper entries; Activation Hero hides Filing court", () => {
    expect(visibleSteps("small_claims").map((s) => s.label)).toEqual(["Your information", "Defendant information", "Filing court", "Your claim", "Review", "Payment"]);
    expect(visibleSteps("activation_hero").map((s) => s.label)).toEqual(["Your information", "Defendant information", "Your claim", "Review", "Payment"]);
  });

  it("maps hidden upgrade/payment steps onto the visible indicator", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((s) => toNavStep(s, "small_claims"))).toEqual([0, 1, 2, 3, 4, 4, 5]);
    expect([1, 2, 3, 4, 5, 6, 7].map((s) => toNavStep(s, "activation_hero"))).toEqual([0, 1, 2, 2, 3, 3, 4]);
  });

  it("clicking a completed stepper item returns to the right internal step", () => {
    expect([0, 1, 2, 3].map((i) => fromNavIndex(i, "small_claims"))).toEqual([1, 2, 3, 4]);
    expect([0, 1, 2, 3].map((i) => fromNavIndex(i, "activation_hero"))).toEqual([1, 2, 4, 5]);
  });

  it("round-trips draft step keys; AH with a detected county resumes past Filing court", () => {
    expect(keyForStep(1)).toBe("customer_information");
    expect(keyForStep(5)).toBe("review");
    expect(keyForStep(7)).toBe("payment");
    expect(stepForKey("claim_information", sc())).toBe(3);
    expect(stepForKey("claim_information", ah())).toBe(4);
    expect(stepForKey("claim_information", ah({ countyId: "" }))).toBe(3);
    expect(stepForKey("review", sc())).toBe(5);
  });
});

describe("pricing", () => {
  it("first class is the base price; certified adds the upsell", () => {
    expect(computeQuote("first_class").totalCents).toBe(DEMAND_LETTER_PRICE_CENTS);
    expect(computeQuote("certified").totalCents).toBe(DEMAND_LETTER_PRICE_CENTS + CERTIFIED_MAIL_UPSELL_CENTS);
    expect(computeQuote(null).certifiedCents).toBe(0);
  });

  it("applies percent coupons to the whole order, case-insensitively", () => {
    const q = computeQuote("certified", " hero10 ");
    expect(q.discountCents).toBe(890);
    expect(q.totalCents).toBe(8010);
    expect(q.couponLabel).toBe("10% off");
    expect(isValidCoupon("hero25")).toBe(true);
    expect(isValidCoupon("nope")).toBe(false);
    expect(computeQuote("certified", "nope").discountCents).toBe(0);
  });
});

describe("card validation", () => {
  const ok = { number: formatCardNumber(TEST_CARD_OK), expiry: "12/30", cvc: "123", name: "Alex Rivera", zip: "95814" };

  it("Luhn-checks numbers; both published test cards are valid numbers", () => {
    expect(luhnValid(TEST_CARD_OK)).toBe(true);
    expect(luhnValid(TEST_CARD_DECLINED)).toBe(true);
    expect(luhnValid("4242424242424241")).toBe(false);
    expect(luhnValid("1234")).toBe(false);
  });

  it("formats as you type", () => {
    expect(formatCardNumber("4242424242424242999")).toBe("4242 4242 4242 4242");
    expect(formatExpiry("1230")).toBe("12/30");
    expect(formatExpiry("1")).toBe("1");
  });

  it("validates every field, including expiry against the clock", () => {
    expect(validateCard(ok, NOW)).toEqual({});
    expect(Object.keys(validateCard({ number: "", expiry: "", cvc: "", name: "", zip: "" }, NOW)).sort()).toEqual(["cvc", "expiry", "name", "number", "zip"]);
    expect(validateCard({ ...ok, expiry: "01/20" }, NOW).expiry).toMatch(/expired/);
    expect(validateCard({ ...ok, expiry: "13/30" }, NOW).expiry).toMatch(/month/);
    expect(validateCard({ ...ok, expiry: "10/26" }, NOW).expiry).toBeUndefined();
  });
});

describe("counties", () => {
  it("maps ZIPs to counties by prefix and tolerates ZIP+4", () => {
    expect(countyForZip("95814")?.id).toBe("sacramento-ca");
    expect(countyForZip("95814-1234")?.id).toBe("sacramento-ca");
    expect(countyForZip("90010")?.id).toBe("los-angeles-ca");
    expect(countyForZip("00000")).toBeNull();
    expect(countyForZip("95")).toBeNull();
  });

  it("every seeded case and draft county resolves from its defendant ZIP", () => {
    for (const c of seed.cases) {
      const found = COUNTIES.find((x) => x.name === c.county.name && x.state === c.county.state);
      expect(found, c.id).toBeDefined();
    }
  });

  it("searches by name, state or ZIP, and needs two characters", () => {
    expect(searchCounties("sacr").map((c) => c.id)).toEqual(["sacramento-ca"]);
    expect(searchCounties("TX").length).toBeGreaterThan(1);
    expect(searchCounties("90210").map((c) => c.id)).toEqual(["los-angeles-ca"]);
    expect(searchCounties("s")).toEqual([]);
    expect(searchCounties("zzzz")).toEqual([]);
  });

  it("suggests both sides, and null when a ZIP is unknown or absent", () => {
    expect(suggestCounties("95814", "90010")).toMatchObject({ claimant: { id: "sacramento-ca" }, defendant: { id: "los-angeles-ca" } });
    expect(suggestCounties("95814", null).defendant).toBeNull();
    expect(suggestCounties("00000", "00000")).toEqual({ claimant: null, defendant: null });
  });
});

describe("email typo suggestions", () => {
  it.each([
    ["jane@gmial.com", "jane@gmail.com"],
    ["jane@yaho.com", "jane@yahoo.com"],
    ["jane@hotmail.con", "jane@hotmail.com"],
    ["jane@gnail.com", "jane@gmail.com"],
  ])("%s → %s", (input, fixed) => expect(suggestEmailCorrection(input)).toBe(fixed));

  it("stays quiet for correct and unusual domains", () => {
    for (const ok of ["jane@gmail.com", "jane@company.io", "no-at-sign", "jane@", "@gmail.com"]) {
      expect(suggestEmailCorrection(ok), ok).toBeNull();
    }
  });
});

describe("buildCaseFromIntake", () => {
  const ctx = { existingRefs: seed.cases.map((c) => c.referenceCode), now: NOW };

  it("creates a Small Claims case waiting on our team, with the next reference number", () => {
    const c = buildCaseFromIntake(sc(), ctx);
    expect(c.referenceCode).toBe("SC-20932");
    expect(c.id).toBe("case-sc-20932");
    expect(c.status).toBe("paid_pending_letter_review");
    expect(c.claimType).toBe("contract_dispute");
    expect(c.amountCents).toBe(150_000);
    expect(c.defendant).toMatchObject({ name: "Acme LLC", address: { state: "CA" } });
    expect(c.county).toEqual({ name: "Sacramento County", state: "CA" });
    expect(c.mailingMethod).toBe("certified");
    expect(c.activity).toHaveLength(1);
    expect(c.letter.versions).toHaveLength(0);
  });

  it("creates an Activation Hero case waiting on the customer, defendant = platform, claim type pending", () => {
    const c = buildCaseFromIntake(ah(), ctx);
    expect(c.referenceCode).toBe("AH-30418");
    expect(c.status).toBe("paid_pending_claim_type_selection");
    expect(c.claimType).toBeNull();
    expect(c.defendant.name).toBe("DoorDash, Inc.");
    expect(c.defendant.address.city).toBe("San Francisco");
    expect(c.hasEvidenceToUpload).toBe(true);
  });

  it("maps every Small Claims category and falls back to 'other'", () => {
    const type = (cat: string) => buildCaseFromIntake(sc({ claimCategories: [cat] }), ctx).claimType;
    expect(type("Money owed")).toBe("unpaid_loan");
    expect(type("Landlord-tenant")).toBe("landlord_tenant");
    expect(type("Get my belongings back")).toBe("other");
    expect(type("???")).toBe("other");
  });

  it("numbers references per service, from the floor when there are none", () => {
    expect(nextReference("small_claims", [])).toBe("SC-20001");
    expect(nextReference("activation_hero", ["SC-99999"])).toBe("AH-30001");
    expect(nextReference("small_claims", ["SC-20005", "SC-20010", "AH-30500"])).toBe("SC-20011");
  });
});

describe("safeNextPath (no open redirects)", () => {
  it("allows same-site paths only", () => {
    expect(safeNextPath("/dashboard/cases/x")).toBe("/dashboard/cases/x");
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil", "", null, undefined]) {
      expect(safeNextPath(bad as string | null | undefined), String(bad)).toBe("/dashboard");
    }
    expect(safeNextPath("nope", "/x")).toBe("/x");
  });
});
