import { describe, expect, it } from "vitest";
import { getDocuments, renderDocumentText } from "@/lib/domain/documents";
import { ACTIVITY_LABELS } from "@/lib/domain/labels";
import { buildLetter, latestVersion, letterToPlainText } from "@/lib/domain/letter";
import { getCourtSteps, getLetterSteps, getResponseSteps } from "@/lib/domain/steps";
import { validateTaskFields } from "@/lib/domain/tasks";
import { setStrict } from "@/lib/domain/strict";
import { daysRemaining, isExpired, windowElapsedPercent } from "@/lib/domain/time";
import { ACTIVITY_TYPES } from "@/lib/domain/types";
import { formatBytes, formatCurrency, formatPhone } from "@/lib/format";
import { NOW, seed, seedCase } from "./helpers";

const fmt = (iso: string) => iso.slice(0, 10);

describe("time", () => {
  const day = 86_400_000;
  it("rounds partial days up and never goes negative", () => {
    expect(daysRemaining(new Date(NOW.getTime() + 2 * day - 1000).toISOString(), NOW)).toBe(2);
    expect(daysRemaining(new Date(NOW.getTime() + 3600_000).toISOString(), NOW)).toBe(1);
    expect(daysRemaining(new Date(NOW.getTime() - day).toISOString(), NOW)).toBe(0);
  });
  it("treats the exact deadline as expired", () => {
    expect(isExpired(NOW.toISOString(), NOW)).toBe(true);
  });
  it("computes elapsed percent clamped to 0–100", () => {
    const start = new Date(NOW.getTime() - 10 * day).toISOString();
    const end = new Date(NOW.getTime() + 10 * day).toISOString();
    expect(windowElapsedPercent(start, end, NOW)).toBe(50);
    expect(windowElapsedPercent(start, end, new Date(NOW.getTime() + 99 * day))).toBe(100);
    expect(windowElapsedPercent(start, end, new Date(NOW.getTime() - 99 * day))).toBe(0);
    expect(windowElapsedPercent(end, start, NOW)).toBe(100);
  });
});

describe("timelines", () => {
  it("letter steps reflect where the case stopped", () => {
    const states = (id: string) => Object.fromEntries(getLetterSteps(seedCase(id), fmt).map((s) => [s.id, s.state]));
    expect(states("sc-awaiting-signature")).toMatchObject({ drafting: "complete", sign: "active", sent: "pending" });
    expect(states("sc-letter-in-progress")).toMatchObject({ drafting: "internal", sign: "pending" });
    expect(states("sc-ready-to-send")).toMatchObject({ sign: "complete", sent: "active" });
    expect(states("sc-waiting-window")).toMatchObject({ sent: "complete" });
  });

  it("only Activation Hero has a questionnaire step, and it is gated on being organized", () => {
    expect(getLetterSteps(seedCase("sc-awaiting-signature"), fmt).some((s) => s.id === "questionnaire")).toBe(false);
    const ah = getLetterSteps(seedCase("ah-get-organized"), fmt);
    expect(ah.find((s) => s.id === "questionnaire")?.state).toBe("pending");
    // The prototype never blocks: the link is there even before the customer is "organized"...
    expect(ah.find((s) => s.id === "questionnaire")?.action).toMatchObject({ kind: "link" });
    // ...while strict mode keeps the real gate.
    setStrict(true);
    expect(getLetterSteps(seedCase("ah-get-organized"), fmt).find((s) => s.id === "questionnaire")?.action).toBeUndefined();
    const organized = getLetterSteps({ ...seedCase("ah-get-organized"), hasEvidenceToUpload: false }, fmt);
    expect(organized.find((s) => s.id === "questionnaire")?.state).toBe("active");
    expect(organized.find((s) => s.id === "questionnaire")?.action).toMatchObject({ kind: "link" });
  });

  it("the send step exposes the send_mailing command only when signed", () => {
    const action = (id: string) => getLetterSteps(seedCase(id), fmt).find((s) => s.id === "sent")?.action;
    expect(action("sc-ready-to-send")).toEqual({ kind: "command", label: "Send letter →", command: "send_mailing" });
    expect(action("sc-awaiting-signature")).toBeUndefined();
  });

  it("response steps offer 'mark early' while open and 'mark outcome' once closed", () => {
    expect(getResponseSteps(seedCase("sc-waiting-window"), NOW, fmt)[0]?.action).toMatchObject({ label: "Mark early →" });
    const closed = getResponseSteps(seedCase("ah-outcome-needed"), NOW, fmt);
    expect(closed[1]).toMatchObject({ state: "active", action: { label: "Mark outcome →" } });
  });

  it("court steps surface the reviewer's note on rejected steps", () => {
    const steps = getCourtSteps(seedCase("sc-court-needs-changes"));
    expect(steps.map((s) => s.state)).toEqual(["complete", "active", "pending", "pending", "pending"]);
    expect(steps[1]?.note?.tone).toBe("danger");
    expect(getCourtSteps(seedCase("sc-court-in-review")).map((s) => s.state)[2]).toBe("internal");
  });
});

describe("task field validation", () => {
  it("flags required, checkbox and amount formats", () => {
    expect(validateTaskFields("form_online", {})).toHaveProperty("confirmationNumber");
    expect(validateTaskFields("form_online", { confirmationNumber: "x", attest: "false" })).toHaveProperty("attest");
    expect(validateTaskFields("fee_online", { amountPaid: "$75", receiptNumber: "r" })).toHaveProperty("amountPaid");
    expect(validateTaskFields("fee_online", { amountPaid: "75.5", receiptNumber: "r" })).toEqual({});
    expect(validateTaskFields("court_date", { courtDate: "2026-11-01", courtTime: "10:00" })).toEqual({});
  });
});

describe("letter & documents", () => {
  const c = seedCase("sc-ready-to-send");
  it("builds a letter from structured data with the signature once signed", () => {
    const letter = buildLetter(c, seed.profile, latestVersion(c)!);
    expect(letter.recipient[0]).toBe(c.defendant.name);
    expect(letter.paragraphs.join(" ")).toContain("$680.00");
    expect(letter.signedName).toBe("Alex Rivera");
    expect(letterToPlainText(letter)).toContain("signed");
    expect(letterToPlainText({ ...letter, signedName: null })).toContain("[signature pending]");
  });

  it("derives documents from case progress", () => {
    const kinds = (id: string) => getDocuments(seedCase(id)).map((d) => d.kind);
    expect(kinds("sc-letter-in-progress")).toEqual(["intake_summary"]);
    expect(kinds("sc-ready-to-send")).toEqual(["intake_summary", "signed_letter"]);
    expect(kinds("sc-waiting-window")).toEqual(["intake_summary", "signed_letter", "mailing_proof", "certified_receipt"]);
    expect(kinds("sc-closed-settled")).toContain("case_summary");
  });

  it("renders text for every document kind", () => {
    for (const id of ["sc-waiting-window", "sc-closed-settled"]) {
      for (const doc of getDocuments(seedCase(id))) {
        const text = renderDocumentText(doc, seedCase(id), seed.profile);
        expect(text).toContain("PROTOTYPE");
        expect(text.length).toBeGreaterThan(60);
      }
    }
  });
});

describe("labels & formatting", () => {
  it("has activity copy for every activity type", () => {
    for (const type of ACTIVITY_TYPES) expect(ACTIVITY_LABELS[type].length).toBeGreaterThan(3);
  });
  it("formats", () => {
    expect(formatCurrency(1850)).toBe("$1,850.00");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatPhone("5555550142")).toBe("(555) 555-0142");
    expect(formatPhone("+44 20")).toBe("+44 20");
  });
});
