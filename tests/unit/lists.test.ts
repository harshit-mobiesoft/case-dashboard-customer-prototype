import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, filtersActive, groupDashboard, sortOpenCases, summarize } from "@/lib/domain/dashboard";
import { getEvidenceSuggestions } from "@/lib/domain/evidence-suggestions";
import { parseUsdToCents } from "@/lib/domain/money";
import { normalizeProfile, validateProfile } from "@/lib/domain/profile";
import { groupByCategory, QUESTIONS } from "@/lib/domain/questionnaire";
import { getBucket } from "@/lib/domain/status";
import { NOW, seed, seedCase } from "./helpers";

describe("dashboard grouping", () => {
  const group = (f: Partial<typeof DEFAULT_FILTERS>) =>
    groupDashboard(seed.cases, seed.drafts, { ...DEFAULT_FILTERS, ...f }, NOW);

  it("splits open / drafts / closed", () => {
    const g = group({});
    // Only the dashboard cases are listed; the other stages are demo scenarios.
    const visible = seed.cases.filter((c) => !c.hiddenFromDashboard);
    expect(visible).toHaveLength(9);
    expect(g.open).toHaveLength(visible.filter((c) => c.status !== "closed").length);
    expect(g.drafts).toHaveLength(2);
    expect(g.closed).toHaveLength(1);
    expect([...g.open, ...g.closed].every((c) => !c.hiddenFromDashboard)).toBe(true);
  });

  it("orders open cases: your turn, then our turn, then waiting — newest activity first within a bucket", () => {
    const order = sortOpenCases(group({}).open, NOW).map((c) => getBucket(c, NOW));
    const rank = { waiting_on_client: 0, waiting_on_us: 1, waiting_period: 2, done: 3 } as const;
    expect(order.map((b) => rank[b])).toEqual([...order.map((b) => rank[b])].sort((a, b) => a - b));
  });

  it("searches defendant, claim type, reference code and service (case-insensitive)", () => {
    expect(group({ query: "DOORDASH" }).open.map((c) => c.id)).toEqual(["ah-awaiting-signature"]);
    expect(group({ query: "wrongful" }).open.length).toBeGreaterThan(1);
    expect(group({ query: "ah-30344" }).open.map((c) => c.id)).toEqual(["ah-awaiting-signature"]);
    expect(group({ query: "activation hero" }).open).toHaveLength(4);
    expect(group({ query: "small claims" }).open).toHaveLength(4);
    // Scenario-only cases never show up in search, even when they match.
    expect(group({ query: "pinecrest" }).open.map((c) => c.id)).toEqual(["sc-awaiting-signature"]);
    expect(group({ query: "delgado" }).open).toEqual([]);
  });

  it("filters by service and view, and applies the service filter to drafts", () => {
    expect(group({ service: "activation_hero" }).drafts).toHaveLength(1);
    expect(group({ service: "small_claims" }).open).toHaveLength(4);
    const closedOnly = group({ view: "closed" });
    expect(closedOnly.open).toHaveLength(0);
    expect(closedOnly.drafts).toHaveLength(0);
    expect(closedOnly.closed).toHaveLength(1);
    expect(group({ view: "draft" }).open).toHaveLength(0);
  });

  it("reports whether filters are active and summarises buckets", () => {
    expect(filtersActive(DEFAULT_FILTERS)).toBe(false);
    expect(filtersActive({ ...DEFAULT_FILTERS, query: " x " })).toBe(true);
    expect(filtersActive({ ...DEFAULT_FILTERS, query: "   " })).toBe(false);
    const counts = summarize(seed.cases, NOW);
    expect(counts.done).toBe(3);
    expect(counts.waiting_period).toBe(3);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(seed.cases.length);
  });
});

describe("parseUsdToCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["$1,250.00", 125000],
    ["0.07", 7],
    ["  3  ", 300],
  ])("parses %s", (input, cents) => expect(parseUsdToCents(input)).toBe(cents));

  it("treats blank as null and junk as invalid", () => {
    expect(parseUsdToCents("")).toBeNull();
    expect(parseUsdToCents("   ")).toBeNull();
    for (const bad of ["abc", "1.234", "-5", "1e3", "12.", "$$5"]) expect(parseUsdToCents(bad), bad).toBe("invalid");
  });
});

describe("profile validation", () => {
  const ok = seed.profile;
  it("accepts the seeded profile", () => expect(validateProfile(ok)).toEqual({}));

  it("flags every bad field", () => {
    const errors = validateProfile({
      ...ok,
      firstName: " ",
      lastName: "",
      phone: "12345",
      address: { line1: "", city: "", state: "ZZ", zip: "1234" },
    });
    expect(Object.keys(errors).sort()).toEqual(["city", "firstName", "lastName", "line1", "phone", "state", "zip"]);
  });

  it("accepts ZIP+4 and formatted phones; normalize trims and strips", () => {
    expect(validateProfile({ ...ok, phone: "(916) 555-0100", address: { ...ok.address, zip: "95814-1234" } })).toEqual({});
    const n = normalizeProfile({ ...ok, firstName: " Al ", phone: "(916) 555-0100" });
    expect(n.firstName).toBe("Al");
    expect(n.phone).toBe("9165550100");
  });
});

describe("questionnaire & suggestions", () => {
  it("has the five production questions with unique keys, under one General heading", () => {
    expect(new Set(QUESTIONS.map((q) => q.key)).size).toBe(QUESTIONS.length);
    const groups = groupByCategory(QUESTIONS);
    expect(groups.map((g) => g.category)).toEqual(["General"]);
    expect(groups.flatMap((g) => g.questions)).toHaveLength(5);
    expect(QUESTIONS[0]!.text).toMatch(/^Default: deactivation breaches/);
  });

  it("suggests evidence by claim type and omits what's already logged", () => {
    const c = seedCase("sc-letter-in-progress");
    const all = getEvidenceSuggestions(c);
    expect(all.length).toBe(3);
    const logged = { ...c, evidence: [{ id: "e", title: all[0]!.title.toUpperCase(), type: "other" as const, notes: "", files: [], createdAt: "" }] };
    expect(getEvidenceSuggestions(logged)).toHaveLength(2);
    expect(getEvidenceSuggestions({ ...c, claimType: null })).toHaveLength(3);
  });
});
