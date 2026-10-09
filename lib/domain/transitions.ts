// Pure state transitions: (case, input, now) → new case. No React, no I/O, no Date.now().
// Each transition checks the current status and throws TransitionError when the move is
// illegal, so the UI can't drift into impossible states (e.g. mailing an unsigned letter).

import { isOrganized } from "./evidence";
import { isResponseWindowExpired } from "./status";
import { createCourtTasks, validateTaskFields } from "./tasks";
import { RESPONSE_WINDOW_DAYS, addDays, subtractDays } from "./time";
import {
  REVISION_REASONS,
  UNSATISFACTORY_ISSUES,
  type ActivityType,
  type CaseRecord,
  type ClaimStatus,
  type ClaimType,
  type EvidenceFile,
  type EvidenceItem,
  type EvidenceType,
  type RevisionReason,
  type SettlementResolution,
} from "./types";

/** Same rule as production: a change request needs a reason chip and at least 10 characters of detail. */
export const MIN_REVISION_DETAILS = 10;

export const DEMO_DROPBOX_EMAIL = "alex.rivera@dropbox.example";

export type TransitionErrorCode =
  | "invalid_status"
  | "validation"
  | "not_found"
  | "not_organized"
  | "nothing_to_do";

export class TransitionError extends Error {
  constructor(
    public readonly code: TransitionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TransitionError";
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function assertStatus(c: CaseRecord, allowed: readonly ClaimStatus[], what: string): void {
  if (!allowed.includes(c.status)) {
    throw new TransitionError("invalid_status", `You can't ${what} while this case is "${c.status}".`);
  }
}

function logged(c: CaseRecord, now: Date, types: ActivityType[], patch: Partial<CaseRecord>): CaseRecord {
  const at = now.toISOString();
  const activity = [...c.activity];
  for (const type of types) {
    activity.push({ id: `${c.id}-a${activity.length + 1}`, type, at });
  }
  return { ...c, ...patch, activity, updatedAt: at };
}

function nextSeq(ids: string[], prefix: string): number {
  const used = ids
    .map((id) => (id.startsWith(prefix) ? Number(id.slice(prefix.length)) : NaN))
    .filter((n) => Number.isFinite(n));
  return (used.length ? Math.max(...used) : 0) + 1;
}

const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export function signatureMatches(typed: string, legalName: string): boolean {
  return typed.trim() !== "" && normalizeName(typed) === normalizeName(legalName);
}

// ─── Dropbox & evidence ──────────────────────────────────────────────────────

export function connectDropbox(c: CaseRecord, now: Date): CaseRecord {
  if (c.dropbox.connected) return c;
  return logged(c, now, ["dropbox_connected"], {
    dropbox: { connected: true, accountEmail: DEMO_DROPBOX_EMAIL, connectedAt: now.toISOString() },
  });
}

export function disconnectDropbox(c: CaseRecord, now: Date): CaseRecord {
  if (!c.dropbox.connected) return c;
  return logged(c, now, ["dropbox_disconnected"], {
    dropbox: { connected: false, accountEmail: null, connectedAt: null },
  });
}

/** "I have no evidence to add." Not allowed once evidence has been logged. */
export function setNoEvidence(c: CaseRecord, noEvidence: boolean): CaseRecord {
  if (noEvidence && c.evidence.length > 0) {
    throw new TransitionError("validation", "Remove your evidence items first to mark “no evidence”.");
  }
  return { ...c, hasEvidenceToUpload: !noEvidence };
}

export interface EvidenceInput {
  title: string;
  type: EvidenceType;
  notes: string;
  files: { name: string; sizeBytes: number }[];
}

function validateEvidence(input: EvidenceInput): void {
  if (input.title.trim() === "") {
    throw new TransitionError("validation", "Give this evidence a short title.");
  }
  if (input.title.trim().length > 80) {
    throw new TransitionError("validation", "Title must be 80 characters or fewer.");
  }
}

export function addEvidence(c: CaseRecord, input: EvidenceInput, now: Date): CaseRecord {
  validateEvidence(input);
  const seq = nextSeq(c.evidence.map((e) => e.id), `${c.id}-ev`);
  const id = `${c.id}-ev${seq}`;
  const files: EvidenceFile[] = input.files.map((f, i) => ({
    id: `${id}-f${i + 1}`,
    name: f.name,
    sizeBytes: f.sizeBytes,
  }));
  const item: EvidenceItem = {
    id,
    title: input.title.trim(),
    type: input.type,
    notes: input.notes.trim(),
    files,
    createdAt: now.toISOString(),
  };
  return logged(c, now, ["evidence_added"], {
    evidence: [...c.evidence, item],
    hasEvidenceToUpload: true,
  });
}

export function updateEvidence(
  c: CaseRecord,
  itemId: string,
  input: Omit<EvidenceInput, "files"> & { files?: EvidenceInput["files"] },
  now: Date,
): CaseRecord {
  validateEvidence({ ...input, files: input.files ?? [] });
  const existing = c.evidence.find((e) => e.id === itemId);
  if (!existing) throw new TransitionError("not_found", "That evidence item no longer exists.");

  let files = existing.files;
  if (input.files && input.files.length > 0) {
    let seq = nextSeq(existing.files.map((f) => f.id), `${itemId}-f`);
    files = [
      ...existing.files,
      ...input.files.map((f) => ({ id: `${itemId}-f${seq++}`, name: f.name, sizeBytes: f.sizeBytes })),
    ];
  }
  return logged(c, now, ["evidence_updated"], {
    evidence: c.evidence.map((e) =>
      e.id === itemId
        ? { ...e, title: input.title.trim(), type: input.type, notes: input.notes.trim(), files }
        : e,
    ),
  });
}

export function removeEvidenceFile(c: CaseRecord, itemId: string, fileId: string, now: Date): CaseRecord {
  if (!c.evidence.some((e) => e.id === itemId)) {
    throw new TransitionError("not_found", "That evidence item no longer exists.");
  }
  return logged(c, now, ["evidence_updated"], {
    evidence: c.evidence.map((e) =>
      e.id === itemId ? { ...e, files: e.files.filter((f) => f.id !== fileId) } : e,
    ),
  });
}

export function removeEvidence(c: CaseRecord, itemId: string, now: Date): CaseRecord {
  if (!c.evidence.some((e) => e.id === itemId)) {
    throw new TransitionError("not_found", "That evidence item no longer exists.");
  }
  return logged(c, now, ["evidence_removed"], {
    evidence: c.evidence.filter((e) => e.id !== itemId),
  });
}

// ─── Questionnaire (Activation Hero) ─────────────────────────────────────────

/**
 * Stand-in for the production AI/agent step that picks a claim type from the answers. With the
 * current question set every Activation Hero case resolves to a wrongful deactivation.
 */
export function selectClaimType(_answers: Record<string, boolean>): ClaimType {
  return "wrongful_deactivation";
}

export function submitQuestionnaire(
  c: CaseRecord,
  answers: Record<string, boolean>,
  now: Date,
): CaseRecord {
  assertStatus(c, ["paid_pending_claim_type_selection"], "submit the questionnaire");
  if (c.service !== "activation_hero") {
    throw new TransitionError("invalid_status", "Only Activation Hero cases have a questionnaire.");
  }
  if (!isOrganized(c)) {
    throw new TransitionError("not_organized", "Get organized first: add your evidence (and connect Dropbox) or confirm you have none.");
  }
  if (Object.keys(answers).length === 0) {
    throw new TransitionError("validation", "Answer at least one question to continue.");
  }
  return logged(c, now, ["questionnaire_submitted", "claim_type_selected"], {
    status: "paid_pending_letter_review",
    questionnaire: { answers, submittedAt: now.toISOString() },
    claimType: selectClaimType(answers),
  });
}

// ─── Letter: sign / revise ───────────────────────────────────────────────────

export function signLetter(
  c: CaseRecord,
  input: { typedName: string; legalName: string },
  now: Date,
): CaseRecord {
  assertStatus(c, ["letter_signature_sent"], "sign the letter");
  if (!signatureMatches(input.typedName, input.legalName)) {
    throw new TransitionError("validation", "Type your full legal name exactly as shown to sign.");
  }
  return logged(c, now, ["letter_signed"], {
    status: "letter_signed",
    letter: { ...c.letter, signedAt: now.toISOString(), signedName: input.typedName.trim() },
  });
}

export function requestRevision(
  c: CaseRecord,
  input: { reasons: RevisionReason[]; details: string },
  now: Date,
): CaseRecord {
  assertStatus(c, ["letter_signature_sent", "letter_signed"], "request a revision");
  const reasons = input.reasons.filter((r) => REVISION_REASONS.includes(r));
  if (reasons.length === 0) {
    throw new TransitionError("validation", "Pick at least one reason for the change.");
  }
  const details = input.details.trim();
  if (details.length < MIN_REVISION_DETAILS) {
    throw new TransitionError("validation", `Tell us more — at least ${MIN_REVISION_DETAILS} characters.`);
  }
  if (details.length > 1000) {
    throw new TransitionError("validation", "Details must be 1,000 characters or fewer.");
  }
  return logged(c, now, ["revision_requested"], {
    status: "letter_revision_requested",
    revisionRequest: { reasons, details, requestedAt: now.toISOString() },
    // Any prior signature is void once the letter changes.
    letter: { ...c.letter, signedAt: null, signedName: null },
  });
}

// ─── Mailing, response window, outcome ───────────────────────────────────────

function trackingFor(c: CaseRecord): string {
  const digits = c.referenceCode.replace(/\D/g, "").padEnd(8, "0").slice(0, 8);
  return `9407 1000 0000 ${digits.slice(0, 4)} ${digits.slice(4)} 00`;
}

export function sendMailing(c: CaseRecord, now: Date): CaseRecord {
  assertStatus(c, ["letter_signed"], "send the letter");
  return logged(c, now, ["letter_mailed"], {
    status: "mailed",
    mailing: {
      sentAt: now.toISOString(),
      responseWindowEndsAt: addDays(now, RESPONSE_WINDOW_DAYS).toISOString(),
      method: c.mailingMethod,
      trackingNumber: c.mailingMethod === "certified" ? trackingFor(c) : null,
    },
  });
}

export function setReminder(c: CaseRecord, enabled: boolean, now: Date): CaseRecord {
  assertStatus(c, ["mailed"], "change the reminder");
  if (isResponseWindowExpired(c, now)) {
    throw new TransitionError("invalid_status", "The response window has already closed.");
  }
  return { ...c, reminderEnabled: enabled };
}

export function markSettled(c: CaseRecord, resolution: SettlementResolution, now: Date): CaseRecord {
  assertStatus(c, ["mailed"], "mark the case settled");
  return logged(c, now, ["outcome_settled", "case_closed"], {
    status: "closed",
    outcome: {
      type: "settled",
      resolution,
      issues: [],
      amountReceivedCents: null,
      markedAt: now.toISOString(),
    },
  });
}

export function proceedToCourt(
  c: CaseRecord,
  input: { type: "no_response" | "unsatisfactory"; issues?: string[]; amountReceivedCents?: number | null },
  now: Date,
): CaseRecord {
  assertStatus(c, ["mailed"], "proceed to court filing");
  const issues = (input.issues ?? []).filter((i) =>
    (UNSATISFACTORY_ISSUES as readonly string[]).includes(i),
  );
  if (input.type === "unsatisfactory" && issues.length === 0) {
    throw new TransitionError("validation", "Select at least one issue to continue.");
  }
  if (input.amountReceivedCents != null && input.amountReceivedCents < 0) {
    throw new TransitionError("validation", "Amount received can't be negative.");
  }
  return logged(c, now, ["phase2_unlocked"], {
    status: "phase2_unlocked",
    outcome: {
      type: input.type,
      resolution: null,
      issues: input.type === "unsatisfactory" ? issues : [],
      amountReceivedCents: input.amountReceivedCents ?? null,
      markedAt: now.toISOString(),
    },
    tasks: createCourtTasks(c.county),
  });
}

// ─── Court filing ────────────────────────────────────────────────────────────

export function submitTask(
  c: CaseRecord,
  taskId: string,
  fields: Record<string, string>,
  now: Date,
): CaseRecord {
  assertStatus(c, ["phase2_unlocked", "phase2_in_progress"], "submit a court filing step");
  const task = c.tasks.find((t) => t.id === taskId);
  if (!task) throw new TransitionError("not_found", "That step no longer exists.");
  if (task.status !== "unlocked" && task.status !== "rejected") {
    throw new TransitionError("invalid_status", "This step isn't open for submission.");
  }
  const errors = validateTaskFields(task.type, fields);
  const first = Object.values(errors)[0];
  if (first) throw new TransitionError("validation", first);

  return logged(c, now, ["task_submitted"], {
    status: "phase2_in_progress",
    tasks: c.tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: "submitted", submission: { submittedAt: now.toISOString(), fields }, reviewNote: null }
        : t,
    ),
  });
}

export function closeCase(c: CaseRecord, now: Date): CaseRecord {
  assertStatus(c, ["phase2_completed"], "close the case");
  return logged(c, now, ["case_closed"], { status: "closed" });
}

// ─── Demo-only: things our (simulated) team and the clock do ─────────────────

export type TeamAction = "advance" | "request_changes";

export function describeTeamAction(c: CaseRecord): { advance: string | null; requestChanges: string | null } {
  const submitted = c.tasks.find((t) => t.status === "submitted");
  return {
    advance:
      c.status === "paid_pending_letter_review"
        ? "Draft the letter & send for signature"
        : c.status === "letter_revision_requested"
          ? "Apply the requested changes & resend"
          : submitted
            ? "Approve the submitted step"
            : null,
    requestChanges: submitted ? "Reject the submitted step" : null,
  };
}

function withNewLetterVersion(c: CaseRecord, source: "system_generated" | "agent_edit", now: Date) {
  const number = c.letter.versions.length + 1;
  return [
    ...c.letter.versions,
    { id: `${c.id}-v${number}`, number, source, createdAt: now.toISOString() },
  ];
}

export function simulateTeamAction(c: CaseRecord, action: TeamAction, now: Date): CaseRecord {
  if (action === "advance") {
    if (c.status === "paid_pending_letter_review") {
      return logged(c, now, ["letter_sent_for_signature"], {
        status: "letter_signature_sent",
        letter: { ...c.letter, versions: withNewLetterVersion(c, "system_generated", now) },
      });
    }
    if (c.status === "letter_revision_requested") {
      return logged(c, now, ["letter_revised", "letter_sent_for_signature"], {
        status: "letter_signature_sent",
        revisionRequest: null,
        letter: { ...c.letter, versions: withNewLetterVersion(c, "agent_edit", now) },
      });
    }
    const submitted = c.tasks.find((t) => t.status === "submitted");
    if (submitted && (c.status === "phase2_in_progress" || c.status === "phase2_unlocked")) {
      let unlockedNext = false;
      const tasks = c.tasks.map((t) => {
        if (t.id === submitted.id) return { ...t, status: "approved" as const, approvedAt: now.toISOString() };
        return t;
      });
      const next = tasks.find((t) => t.status === "locked");
      const final = tasks.map((t) => {
        if (next && t.id === next.id) {
          unlockedNext = true;
          return { ...t, status: "unlocked" as const };
        }
        return t;
      });
      const allApproved = final.every((t) => t.status === "approved");
      return logged(c, now, ["task_approved"], {
        tasks: final,
        status: allApproved ? "phase2_completed" : unlockedNext ? "phase2_in_progress" : c.status,
      });
    }
  }

  if (action === "request_changes") {
    const submitted = c.tasks.find((t) => t.status === "submitted");
    if (submitted) {
      return logged(c, now, ["task_rejected"], {
        tasks: c.tasks.map((t) =>
          t.id === submitted.id
            ? {
                ...t,
                status: "rejected" as const,
                reviewNote:
                  "The details you entered don't match what we can verify. Please double-check and resubmit.",
              }
            : t,
        ),
      });
    }
  }

  throw new TransitionError("nothing_to_do", "Nothing is waiting on our team for this case.");
}

/** Jump the clock so the 21-day response window has just closed. */
export function fastForwardResponseWindow(c: CaseRecord, now: Date): CaseRecord {
  assertStatus(c, ["mailed"], "fast-forward the response window");
  if (!c.mailing) throw new TransitionError("invalid_status", "This case hasn't been mailed yet.");
  if (isResponseWindowExpired(c, now)) {
    throw new TransitionError("nothing_to_do", "The response window has already closed.");
  }
  return {
    ...c,
    updatedAt: now.toISOString(),
    mailing: {
      ...c.mailing,
      sentAt: subtractDays(now, RESPONSE_WINDOW_DAYS).toISOString(),
      responseWindowEndsAt: new Date(now.getTime() - 60_000).toISOString(),
    },
  };
}
