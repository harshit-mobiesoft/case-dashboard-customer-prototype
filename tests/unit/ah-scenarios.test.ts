import { describe, expect, it } from "vitest";
import { getDocuments } from "@/lib/domain/documents";
import { isOrganized, needsEvidenceUpload } from "@/lib/domain/evidence";
import { getPhaseStates } from "@/lib/domain/phases";
import { getCourtSteps, getLetterSteps, getResponseSteps } from "@/lib/domain/steps";
import { getStatusLabel, resolveDropboxBar, resolveStatusBar } from "@/lib/domain/status";
import { daysRemaining } from "@/lib/domain/time";
import * as t from "@/lib/domain/transitions";
import { NOW, seed, seedCase } from "./helpers";

const fmt = (iso: string) => iso.slice(0, 10);
const AH = seed.cases.filter((c) => c.service === "activation_hero");

describe("Activation Hero seed: one case per stage", () => {
  it("every AH case is internally consistent", () => {
    for (const c of AH) {
      expect(c.referenceCode, c.id).toMatch(/^AH-\d{5}$/);
      expect(c.defendant.name.length, c.id).toBeGreaterThan(2);
      // A claim type only exists once the questionnaire has been answered.
      expect(c.claimType === null, c.id).toBe(c.status === "paid_pending_claim_type_selection");
      if (c.status !== "paid_pending_claim_type_selection") expect(c.questionnaire, c.id).not.toBeNull();
      // Anything past "mailed" has a mailing; anything in court filing has tasks.
      if (["mailed", "phase2_unlocked", "phase2_in_progress", "phase2_completed", "closed"].includes(c.status)) {
        expect(c.mailing, c.id).not.toBeNull();
      }
      if (c.tasks.length) expect(c.outcome, c.id).not.toBeNull();
    }
  });

  it("reference codes are unique and leave room for the next intake (AH-30418)", () => {
    const refs = seed.cases.map((c) => c.referenceCode);
    expect(new Set(refs).size).toBe(refs.length);
    const max = Math.max(...AH.map((c) => Number(c.referenceCode.slice(3))));
    expect(max).toBe(30417);
  });

  const bar = (id: string) => resolveStatusBar(seedCase(id), NOW);

  it("get organized → questionnaire is gated, then unlocked once organized", () => {
    expect(bar("ah-get-organized").cta?.hrefSuffix).toBe("/documents");
    expect(isOrganized(seedCase("ah-get-organized"))).toBe(false);
    expect(isOrganized(seedCase("ah-questionnaire-ready"))).toBe(true);
    expect(bar("ah-questionnaire-ready")).toMatchObject({ bucket: "waiting_on_client", cta: { hrefSuffix: "/questionnaire" } });
  });

  it("evidence nudge: Dropbox connected, evidence logged, no file attached", () => {
    const c = seedCase("ah-evidence-nudge");
    expect(needsEvidenceUpload(c)).toBe(true);
    expect(bar("ah-evidence-nudge")).toMatchObject({ bucket: "waiting_on_us", title: expect.stringMatching(/upload your evidence/i) });
    expect(resolveDropboxBar(c, bar("ah-evidence-nudge"))).toBeNull();
  });

  it("team stages and customer stages show the right bar", () => {
    expect(bar("ah-letter-in-progress").title).toMatch(/preparing your demand letter/);
    expect(bar("ah-revision-requested").title).toMatch(/reviewing your letter/);
    expect(bar("ah-awaiting-signature").cta?.hrefSuffix).toBe("/review");
    expect(bar("ah-ready-to-send").title).toMatch(/send your signed letter/);
  });

  it("waiting window, urgent window, and window closed", () => {
    expect(bar("ah-waiting-window").bucket).toBe("waiting_period");
    expect(daysRemaining(seedCase("ah-waiting-window").mailing!.responseWindowEndsAt, NOW)).toBe(14);
    expect(daysRemaining(seedCase("ah-window-urgent").mailing!.responseWindowEndsAt, NOW)).toBe(2);
    expect(bar("ah-outcome-needed").cta?.hrefSuffix).toBe("/outcome");
    expect(getResponseSteps(seedCase("ah-outcome-needed"), NOW, fmt)[1]?.state).toBe("active");
  });

  it("court filing: just started, needs changes, in review, ready to close", () => {
    expect(bar("ah-court-just-started").title).toMatch(/start your next court filing step/);
    expect(getCourtSteps(seedCase("ah-court-just-started")).map((s) => s.state)).toEqual(["active", "pending", "pending", "pending", "pending"]);
    expect(bar("ah-court-needs-changes").title).toMatch(/needs changes/);
    expect(getCourtSteps(seedCase("ah-court-needs-changes"))[1]?.note?.tone).toBe("danger");
    expect(bar("ah-court-in-review").bucket).toBe("waiting_on_us");
    expect(bar("ah-court-ready-to-close").title).toMatch(/close out your case/);
  });

  it("closed cases: settled skips court filing, the other completed it", () => {
    expect(getPhaseStates(seedCase("ah-closed-settled")).court).toBe("skipped");
    expect(getPhaseStates(seedCase("ah-closed-court")).court).toBe("complete");
    expect(getStatusLabel(seedCase("ah-closed-settled"))).toBe("Closed");
    expect(getDocuments(seedCase("ah-closed-court")).map((d) => d.kind)).toEqual(["intake_summary", "signed_letter", "mailing_proof", "certified_receipt", "case_summary"]);
    expect(getDocuments(seedCase("ah-closed-settled")).map((d) => d.kind)).toEqual(["intake_summary", "signed_letter", "mailing_proof", "case_summary"]);
  });

  it("the letter timeline for AH includes the questionnaire step in the right state", () => {
    const state = (id: string) => getLetterSteps(seedCase(id), fmt).find((s) => s.id === "questionnaire")?.state;
    expect(state("ah-get-organized")).toBe("pending");
    expect(state("ah-questionnaire-ready")).toBe("active");
    expect(state("ah-letter-in-progress")).toBe("complete");
  });
});

describe("Activation Hero: walking each stage forward", () => {
  it("full journey from 'questionnaire ready' to closed, via the same transitions the UI uses", () => {
    let c = seedCase("ah-questionnaire-ready");
    c = t.submitQuestionnaire(c, { false_claim: true, retaliation: false }, NOW);
    expect(c).toMatchObject({ status: "paid_pending_letter_review", claimType: "wrongful_deactivation" });
    c = t.simulateTeamAction(c, "advance", NOW);
    c = t.signLetter(c, { typedName: "Alex Rivera", legalName: "Alex Rivera" }, NOW);
    c = t.sendMailing(c, NOW);
    c = t.fastForwardResponseWindow(c, NOW);
    expect(resolveStatusBar(c, NOW).cta?.hrefSuffix).toBe("/outcome");
    c = t.proceedToCourt(c, { type: "no_response" }, NOW);
    expect(c.tasks).toHaveLength(5);
    expect(c.status).toBe("phase2_unlocked");
  });

  it("evidence nudge clears once a file is attached", () => {
    const c = seedCase("ah-evidence-nudge");
    const item = c.evidence[0]!;
    const withFile = t.updateEvidence(c, item.id, { title: item.title, type: item.type, notes: item.notes, files: [{ name: "email.png", sizeBytes: 1000 }] }, NOW);
    expect(needsEvidenceUpload(withFile)).toBe(false);
    expect(resolveStatusBar(withFile, NOW).title).toMatch(/preparing your demand letter/);
  });

  it("revision loop: team applies changes, customer signs the new version", () => {
    let c = t.simulateTeamAction(seedCase("ah-revision-requested"), "advance", NOW);
    expect(c.status).toBe("letter_signature_sent");
    expect(c.letter.versions.at(-1)).toMatchObject({ number: 2, source: "agent_edit" });
    c = t.signLetter(c, { typedName: "alex rivera", legalName: "Alex Rivera" }, NOW);
    expect(c.status).toBe("letter_signed");
  });

  it("court filing from 'just started': submit, approve, reject, resubmit", () => {
    let c = seedCase("ah-court-just-started");
    const first = c.tasks[0]!;
    c = t.submitTask(c, first.id, { confirmationNumber: "X-1", attest: "true" }, NOW);
    c = t.simulateTeamAction(c, "request_changes", NOW);
    expect(c.tasks[0]!.status).toBe("rejected");
    c = t.submitTask(c, first.id, { confirmationNumber: "X-2", attest: "true" }, NOW);
    c = t.simulateTeamAction(c, "advance", NOW);
    expect(c.tasks.map((x) => x.status)).toEqual(["approved", "unlocked", "locked", "locked", "locked"]);
  });

  it("ready to close → closed keeps its court outcome", () => {
    const c = t.closeCase(seedCase("ah-court-ready-to-close"), NOW);
    expect(c.status).toBe("closed");
    expect(c.outcome?.type).toBe("no_response");
  });
});
