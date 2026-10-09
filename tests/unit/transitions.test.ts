import { describe, expect, it } from "vitest";
import { isOrganized } from "@/lib/domain/evidence";
import { TASK_FORMS } from "@/lib/domain/tasks";
import * as t from "@/lib/domain/transitions";
import { TransitionError } from "@/lib/domain/transitions";
import { later, NOW, seedCase } from "./helpers";

const legalName = "Alex Rivera";

function expectError(fn: () => unknown, code: t.TransitionErrorCode) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(TransitionError);
    expect((err as TransitionError).code).toBe(code);
    return;
  }
  throw new Error("expected a TransitionError");
}

describe("the full customer journey", () => {
  it("walks letter → sign → mail → no response → court filing → close", () => {
    let c = seedCase("sc-letter-in-progress");

    c = t.simulateTeamAction(c, "advance", NOW);
    expect(c.status).toBe("letter_signature_sent");
    expect(c.letter.versions).toHaveLength(1);

    c = t.signLetter(c, { typedName: "  alex   RIVERA ", legalName }, NOW);
    expect(c.status).toBe("letter_signed");
    expect(c.letter.signedAt).toBe(NOW.toISOString());

    c = t.sendMailing(c, NOW);
    expect(c.status).toBe("mailed");
    expect(c.mailing?.responseWindowEndsAt).toBe(new Date(NOW.getTime() + 21 * 86_400_000).toISOString());

    c = t.proceedToCourt(c, { type: "no_response" }, NOW);
    expect(c.status).toBe("phase2_unlocked");
    expect(c.tasks.map((x) => x.status)).toEqual(["unlocked", "locked", "locked", "locked", "locked"]);

    const goodFields: Record<string, Record<string, string>> = {
      form_online: { confirmationNumber: "X-1", attest: "true" },
      fee_online: { amountPaid: "75.00", receiptNumber: "R-1" },
      serve_mail: { trackingNumber: "9407", mailedOn: "2026-10-10" },
      court_date: { courtDate: "2026-11-20", courtTime: "09:30" },
      hearing: { prepared: "true" },
    };

    for (let i = 0; i < 5; i++) {
      const open = c.tasks.find((x) => x.status === "unlocked");
      expect(open, `step ${i + 1} should be open`).toBeDefined();
      c = t.submitTask(c, open!.id, goodFields[open!.type]!, NOW);
      expect(c.status).toBe("phase2_in_progress");
      c = t.simulateTeamAction(c, "advance", NOW);
    }
    expect(c.status).toBe("phase2_completed");
    expect(c.tasks.every((x) => x.status === "approved")).toBe(true);

    c = t.closeCase(c, NOW);
    expect(c.status).toBe("closed");
    expect(c.activity.map((a) => a.type)).toContain("case_closed");
  });

  it("settles and closes straight from the response window", () => {
    const c = t.markSettled(seedCase("sc-waiting-window"), "partial_payment_agreed", NOW);
    expect(c.status).toBe("closed");
    expect(c.outcome).toMatchObject({ type: "settled", resolution: "partial_payment_agreed" });
    expect(c.tasks).toHaveLength(0);
  });
});

describe("signing", () => {
  const ready = seedCase("sc-awaiting-signature");

  it("requires the exact legal name", () => {
    expectError(() => t.signLetter(ready, { typedName: "Alex", legalName }, NOW), "validation");
    expectError(() => t.signLetter(ready, { typedName: "", legalName }, NOW), "validation");
  });

  it("is only possible while a signature is requested", () => {
    expectError(() => t.signLetter(seedCase("sc-waiting-window"), { typedName: legalName, legalName }, NOW), "invalid_status");
  });

  it("signatureMatches ignores case and extra whitespace only", () => {
    expect(t.signatureMatches(" alex  rivera", legalName)).toBe(true);
    expect(t.signatureMatches("Alexx Rivera", legalName)).toBe(false);
  });
});

describe("revisions", () => {
  it("moves back to the team and voids a prior signature", () => {
    const c = t.requestRevision(seedCase("sc-ready-to-send"), { reasons: ["Wrong amount"], details: "It's $680, not $6.80" }, NOW);
    expect(c.status).toBe("letter_revision_requested");
    expect(c.letter.signedAt).toBeNull();
    expect(c.revisionRequest?.reasons).toEqual(["Wrong amount"]);
  });

  it("needs a reason and at least 10 characters of detail", () => {
    const c = seedCase("sc-awaiting-signature");
    expectError(() => t.requestRevision(c, { reasons: [], details: "long enough text" }, NOW), "validation");
    expectError(() => t.requestRevision(c, { reasons: ["Other"], details: "  " }, NOW), "validation");
    expectError(() => t.requestRevision(c, { reasons: ["Wrong amount"], details: "too short" }, NOW), "validation");
    expectError(() => t.requestRevision(c, { reasons: ["Wrong amount"], details: "x".repeat(1001) }, NOW), "validation");
  });

  it("is rejected once the letter has been mailed", () => {
    expectError(() => t.requestRevision(seedCase("sc-waiting-window"), { reasons: ["Wrong amount"], details: "It should be different" }, NOW), "invalid_status");
  });

  it("the team's follow-up adds a new letter version and clears the request", () => {
    const requested = t.requestRevision(seedCase("sc-awaiting-signature"), { reasons: ["Wrong amount"], details: "It should be different" }, NOW);
    const revised = t.simulateTeamAction(requested, "advance", later(30));
    expect(revised.status).toBe("letter_signature_sent");
    expect(revised.revisionRequest).toBeNull();
    expect(revised.letter.versions.at(-1)).toMatchObject({ number: 2, source: "agent_edit" });
  });
});

describe("mailing & the response window", () => {
  it("only mails a signed letter", () => {
    expectError(() => t.sendMailing(seedCase("sc-awaiting-signature"), NOW), "invalid_status");
  });

  it("issues a tracking number for certified mail only", () => {
    const certified = t.sendMailing({ ...seedCase("sc-ready-to-send"), mailingMethod: "certified" }, NOW);
    expect(certified.mailing?.trackingNumber).toMatch(/^9407 1000 0000/);
    expect(t.sendMailing(seedCase("sc-ready-to-send"), NOW).mailing?.trackingNumber).toBeNull();
  });

  it("fast-forwarding closes the window; doing it twice is refused", () => {
    const c = t.fastForwardResponseWindow(seedCase("sc-waiting-window"), NOW);
    expect(new Date(c.mailing!.responseWindowEndsAt).getTime()).toBeLessThan(NOW.getTime());
    expectError(() => t.fastForwardResponseWindow(c, NOW), "nothing_to_do");
  });

  it("reminders can't be toggled after the window closes", () => {
    expect(t.setReminder(seedCase("ah-window-urgent"), true, NOW).reminderEnabled).toBe(true);
    expectError(() => t.setReminder(seedCase("ah-outcome-needed"), true, NOW), "invalid_status");
  });
});

describe("outcome", () => {
  it("unsatisfactory needs at least one known issue", () => {
    const c = seedCase("sc-waiting-window");
    expectError(() => t.proceedToCourt(c, { type: "unsatisfactory", issues: [] }, NOW), "validation");
    expectError(() => t.proceedToCourt(c, { type: "unsatisfactory", issues: ["made up"] }, NOW), "validation");
    const ok = t.proceedToCourt(c, { type: "unsatisfactory", issues: ["Offer too low"], amountReceivedCents: 5000 }, NOW);
    expect(ok.outcome).toMatchObject({ type: "unsatisfactory", issues: ["Offer too low"], amountReceivedCents: 5000 });
  });

  it("rejects a negative amount", () => {
    expectError(
      () => t.proceedToCourt(seedCase("sc-waiting-window"), { type: "unsatisfactory", issues: ["Offer too low"], amountReceivedCents: -1 }, NOW),
      "validation",
    );
  });

  it("can't be marked twice", () => {
    const closed = seedCase("sc-closed-settled");
    expectError(() => t.markSettled(closed, "full_payment_received", NOW), "invalid_status");
    expectError(() => t.proceedToCourt(closed, { type: "no_response" }, NOW), "invalid_status");
  });
});

describe("court filing tasks", () => {
  const rejected = seedCase("sc-court-needs-changes");

  it("validates every step's form against the shared field config", () => {
    const open = rejected.tasks.find((x) => x.status === "rejected")!;
    expect(open.type).toBe("fee_online");
    expectError(() => t.submitTask(rejected, open.id, {}, NOW), "validation");
    expectError(() => t.submitTask(rejected, open.id, { amountPaid: "seventy", receiptNumber: "R" }, NOW), "validation");
  });

  it("lets a rejected step be resubmitted and clears the reviewer note", () => {
    const open = rejected.tasks.find((x) => x.status === "rejected")!;
    const c = t.submitTask(rejected, open.id, { amountPaid: "75.00", receiptNumber: "R-1" }, NOW);
    const task = c.tasks.find((x) => x.id === open.id)!;
    expect(task.status).toBe("submitted");
    expect(task.reviewNote).toBeNull();
  });

  it("refuses locked or already-approved steps", () => {
    const locked = rejected.tasks.find((x) => x.status === "locked")!;
    const approved = rejected.tasks.find((x) => x.status === "approved")!;
    expectError(() => t.submitTask(rejected, locked.id, {}, NOW), "invalid_status");
    expectError(() => t.submitTask(rejected, approved.id, {}, NOW), "invalid_status");
  });

  it("the team can reject a submitted step with a note", () => {
    const c = t.simulateTeamAction(seedCase("sc-court-in-review"), "request_changes", NOW);
    const task = c.tasks.find((x) => x.status === "rejected")!;
    expect(task.reviewNote).toBeTruthy();
  });

  it("only closes once every step is approved", () => {
    expectError(() => t.closeCase(seedCase("sc-court-in-review"), NOW), "invalid_status");
    expect(t.closeCase(seedCase("sc-court-ready-to-close"), NOW).status).toBe("closed");
  });

  it("every task type has a form with at least one required field", () => {
    for (const fields of Object.values(TASK_FORMS)) expect(fields.some((f) => f.required)).toBe(true);
  });
});

describe("questionnaire (Activation Hero)", () => {
  const ah = seedCase("ah-get-organized");
  const organized = { ...ah, hasEvidenceToUpload: false as const };

  it("requires the customer to be organized first", () => {
    expectError(() => t.submitQuestionnaire(ah, { false_claim: false }, NOW), "not_organized");
  });

  it("requires at least one answer", () => {
    expectError(() => t.submitQuestionnaire(organized, {}, NOW), "validation");
  });

  it("selects a claim type and hands the case to the team", () => {
    const c = t.submitQuestionnaire(organized, { false_claim: false }, NOW);
    expect(c.status).toBe("paid_pending_letter_review");
    expect(c.claimType).toBe("wrongful_deactivation");
  });

  it("is Activation Hero only", () => {
    expectError(() => t.submitQuestionnaire(seedCase("sc-letter-in-progress"), { a: true }, NOW), "invalid_status");
  });
});

describe("evidence & Dropbox", () => {
  const base = seedCase("sc-letter-in-progress");

  it("adding evidence flips the 'no evidence' flag back on and logs activity", () => {
    const c = t.addEvidence(base, { title: "  Contract ", type: "contract", notes: " n ", files: [{ name: "a.pdf", sizeBytes: 10 }] }, NOW);
    expect(c.hasEvidenceToUpload).toBe(true);
    expect(c.evidence[0]).toMatchObject({ title: "Contract", notes: "n" });
    expect(c.evidence[0]!.files[0]!.id).toBe(`${base.id}-ev1-f1`);
    expect(c.activity.at(-1)?.type).toBe("evidence_added");
  });

  it("never reuses an id after a delete", () => {
    let c = t.addEvidence(base, { title: "one", type: "other", notes: "", files: [] }, NOW);
    c = t.addEvidence(c, { title: "two", type: "other", notes: "", files: [] }, NOW);
    c = t.removeEvidence(c, c.evidence[0]!.id, NOW);
    c = t.addEvidence(c, { title: "three", type: "other", notes: "", files: [] }, NOW);
    const ids = c.evidence.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("validates titles", () => {
    expectError(() => t.addEvidence(base, { title: "  ", type: "other", notes: "", files: [] }, NOW), "validation");
    expectError(() => t.addEvidence(base, { title: "x".repeat(81), type: "other", notes: "", files: [] }, NOW), "validation");
  });

  it("can't claim 'no evidence' while evidence exists", () => {
    const c = t.addEvidence(base, { title: "one", type: "other", notes: "", files: [] }, NOW);
    expectError(() => t.setNoEvidence(c, true), "validation");
    expect(t.setNoEvidence(base, true).hasEvidenceToUpload).toBe(false);
  });

  it("connecting is idempotent and drives isOrganized", () => {
    let c = t.addEvidence(base, { title: "one", type: "other", notes: "", files: [] }, NOW);
    expect(isOrganized(c)).toBe(false);
    c = t.connectDropbox(c, NOW);
    expect(t.connectDropbox(c, later(1))).toBe(c);
    expect(isOrganized(c)).toBe(true);
    c = t.disconnectDropbox(c, NOW);
    expect(isOrganized(c)).toBe(false);
  });

  it("update and remove report missing items", () => {
    expectError(() => t.updateEvidence(base, "nope", { title: "x", type: "other", notes: "" }, NOW), "not_found");
    expectError(() => t.removeEvidence(base, "nope", NOW), "not_found");
    expectError(() => t.removeEvidenceFile(base, "nope", "f", NOW), "not_found");
  });
});

describe("simulateTeamAction", () => {
  it("refuses when nothing is waiting on the team", () => {
    expectError(() => t.simulateTeamAction(seedCase("sc-awaiting-signature"), "advance", NOW), "nothing_to_do");
    expectError(() => t.simulateTeamAction(seedCase("sc-awaiting-signature"), "request_changes", NOW), "nothing_to_do");
  });

  it("describes what it would do", () => {
    expect(t.describeTeamAction(seedCase("sc-letter-in-progress")).advance).toMatch(/Draft the letter/);
    expect(t.describeTeamAction(seedCase("sc-court-in-review")).requestChanges).toMatch(/Reject/);
    expect(t.describeTeamAction(seedCase("sc-closed-settled"))).toEqual({ advance: null, requestChanges: null });
  });
});

describe("purity", () => {
  it("never mutates its input", () => {
    const c = seedCase("sc-ready-to-send");
    const snapshot = JSON.stringify(c);
    t.sendMailing(c, NOW);
    t.requestRevision(c, { reasons: ["Wrong amount"], details: "It should be different" }, NOW);
    expect(JSON.stringify(c)).toBe(snapshot);
  });
});
