import { describe, expect, it } from "vitest";
import { isStrict, setStrict } from "@/lib/domain/strict";
import * as t from "@/lib/domain/transitions";
import { createDemoStore } from "@/lib/data/store";
import { createRepository } from "@/lib/data/repository";
import { NOW, seedCase } from "./helpers";

// Default mode: nothing soft-blocks a walkthrough. (Rules about the order of steps still apply.)
describe("non-blocking prototype mode (the default)", () => {
  it("is the default, and strict mode can be toggled", () => {
    expect(isStrict()).toBe(false);
    setStrict(true);
    expect(isStrict()).toBe(true);
  });

  it("signing works with any (even empty) name and records the legal name", () => {
    const c = seedCase("ah-awaiting-signature");
    expect(t.signLetter(c, { typedName: "", legalName: "Alex Rivera" }, NOW).letter.signedName).toBe("Alex Rivera");
    expect(t.signLetter(c, { typedName: "Whoever", legalName: "Alex Rivera" }, NOW).status).toBe("letter_signed");
  });

  it("a change request needs no reason and no details — defaults are filled in", () => {
    const c = t.requestRevision(seedCase("ah-awaiting-signature"), { reasons: [], details: "" }, NOW);
    expect(c.status).toBe("letter_revision_requested");
    expect(c.revisionRequest?.reasons).toEqual(["Other"]);
    expect(c.revisionRequest?.details.length).toBeGreaterThan(10);
  });

  it("the questionnaire can be submitted empty and without being 'organized'", () => {
    const c = t.submitQuestionnaire(seedCase("ah-get-organized"), {}, NOW);
    expect(c.status).toBe("paid_pending_letter_review");
    expect(c.claimType).toBe("wrongful_deactivation");
  });

  it("court steps can be submitted with empty forms, and 'unsatisfactory' needs no issue", () => {
    const court = seedCase("ah-court-just-started");
    expect(t.submitTask(court, court.tasks[0]!.id, {}, NOW).tasks[0]!.status).toBe("submitted");
    const ok = t.proceedToCourt(seedCase("ah-waiting-window"), { type: "unsatisfactory", issues: [] }, NOW);
    expect(ok.status).toBe("phase2_unlocked");
  });

  it("evidence without a title gets a default one", () => {
    const c = t.addEvidence(seedCase("ah-letter-in-progress"), { title: "  ", type: "other", notes: "", files: [] }, NOW);
    expect(c.evidence.at(-1)!.title).toBe("Untitled evidence");
  });

  it("any email signs in", async () => {
    const store = createDemoStore({ storage: null, now: () => NOW });
    store.init();
    const repo = createRepository({ store, latencyMs: 0, now: () => NOW });
    await expect(repo.requestSignIn("anyone@else.com")).resolves.toBeUndefined();
    await expect(repo.requestSignIn("")).resolves.toBeUndefined();
  });

  it("the order-of-steps rules still hold (you can't mail an unsigned letter)", () => {
    expect(() => t.sendMailing(seedCase("ah-awaiting-signature"), NOW)).toThrow();
    expect(() => t.closeCase(seedCase("ah-court-in-review"), NOW)).toThrow();
  });
});
