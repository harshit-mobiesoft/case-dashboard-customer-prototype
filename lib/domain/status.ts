// The ONE place that decides "whose turn is it" for a case.
//
// Every surface (list badge, persistent status bar, phase locks, CTAs) derives from
// STATUS_META and resolveStatusBar(). All lookups are exhaustive `Record<ClaimStatus, …>`
// so adding a status is a compile error until it has copy, a badge and a bucket.

import { isOrganized, needsEvidenceUpload } from "./evidence";
import { isExpired } from "./time";
import type { CaseRecord, ClaimStatus, CourtTask } from "./types";

export type Bucket = "waiting_on_client" | "waiting_on_us" | "waiting_period" | "done";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

export interface Cta {
  label: string;
  /** Relative to /dashboard/cases/{id}; empty string = the case page itself. */
  hrefSuffix: string;
}

export interface StatusBarInfo {
  bucket: Bucket;
  title: string;
  description?: string;
  cta?: Cta;
}

interface StatusMeta extends StatusBarInfo {
  /** Short label for badges and filters. */
  label: string;
  badge: BadgeVariant;
}

export const STATUS_META: Record<ClaimStatus, StatusMeta> = {
  paid_pending_claim_type_selection: {
    label: "Pending",
    badge: "warning",
    bucket: "waiting_on_client",
    title: "Waiting on you — complete your questionnaire",
    description:
      "Answer a few quick questions so our team can select the best legal approach for your case.",
    cta: { label: "Start questionnaire", hrefSuffix: "/questionnaire" },
  },
  paid_pending_letter_review: {
    label: "Pending Review",
    badge: "warning",
    bucket: "waiting_on_us",
    title: "Our team is preparing your demand letter",
  },
  letter_revision_requested: {
    label: "Needs Revision",
    badge: "danger",
    bucket: "waiting_on_us",
    title: "Our team is reviewing your letter",
    description: "We received your requested changes and will send you an updated letter to sign.",
  },
  letter_signature_sent: {
    label: "Awaiting Signature",
    badge: "info",
    bucket: "waiting_on_client",
    title: "Waiting on you — review and sign your letter",
    description: "Review your demand letter and sign it, or ask us to change anything first.",
    cta: { label: "Review and sign", hrefSuffix: "/review" },
  },
  // Mailing is customer-triggered. No CTA here: the "Send letter to defendant"
  // button already lives on the case page itself.
  letter_signed: {
    label: "Signed",
    badge: "success",
    bucket: "waiting_on_client",
    title: "Waiting on you — send your signed letter to the defendant",
    description:
      "Your letter is signed. Use “Send letter to defendant” on this page to mail it and start the response window.",
  },
  mailed: {
    label: "Mailed",
    badge: "success",
    bucket: "waiting_period",
    title: "Letter mailed — waiting on the response window",
    description:
      "Your letter is on its way. We'll update your case once the defendant responds or the window closes.",
  },
  phase2_unlocked: {
    label: "Court Filing",
    badge: "info",
    bucket: "waiting_on_client",
    title: "Waiting on you — start your next court filing step",
  },
  phase2_in_progress: {
    label: "Court Filing",
    badge: "info",
    bucket: "waiting_on_client",
    title: "Waiting on you — continue your court filing steps",
  },
  phase2_completed: {
    label: "Court Filing",
    badge: "info",
    bucket: "waiting_on_client",
    title: "Waiting on you — close out your case",
    description: "Every court filing step has been approved. Close the case to wrap things up.",
  },
  closed: {
    label: "Closed",
    badge: "default",
    bucket: "done",
    title: "Case closed",
  },
};

// A single phase-3 status covers both "you have a form to fill out" and "we're reviewing
// what you submitted", so the open task refines the bucket.
const TASK_STATUS_INFO: Partial<Record<CourtTask["status"], StatusBarInfo>> = {
  unlocked: {
    bucket: "waiting_on_client",
    title: "Waiting on you — continue your court filing steps",
  },
  rejected: {
    bucket: "waiting_on_client",
    title: "Waiting on you — a court filing step needs changes",
    description: "Check the note from our team on the step below and resubmit.",
  },
  submitted: {
    bucket: "waiting_on_us",
    title: "Our team is reviewing what you submitted",
  },
};

export function getActiveTask(c: Pick<CaseRecord, "tasks">): CourtTask | null {
  return (
    c.tasks.find((t) => t.status === "unlocked" || t.status === "rejected" || t.status === "submitted") ??
    null
  );
}

const IN_COURT_FILING = new Set<ClaimStatus>(["phase2_unlocked", "phase2_in_progress"]);

function baseInfo(c: CaseRecord): StatusBarInfo {
  const meta = STATUS_META[c.status];
  if (IN_COURT_FILING.has(c.status)) {
    const task = getActiveTask(c);
    // Nothing submitted yet → "start", not "continue".
    if (c.status === "phase2_unlocked" && task?.status === "unlocked") return meta;
    const refined = task ? TASK_STATUS_INFO[task.status] : undefined;
    if (refined) return refined;
  }
  return meta;
}

const OUTCOME_NEEDED: StatusBarInfo = {
  bucket: "waiting_on_client",
  title: "Waiting on you — the response window has closed",
  description: "Let us know how it went so we can move your case forward.",
  cta: { label: "Mark outcome", hrefSuffix: "/outcome" },
};

const GET_ORGANIZED_FIRST: StatusBarInfo = {
  bucket: "waiting_on_client",
  title: "Waiting on you — get organized",
  description: "Add your evidence or confirm you don’t have any, then answer a few quick questions.",
  cta: { label: "Get organized", hrefSuffix: "/documents" },
};

const EVIDENCE_UPLOAD: Omit<StatusBarInfo, "bucket"> = {
  title: "Upload your evidence while we work on your case",
  description: "You said you have evidence to upload. Adding it now strengthens your case.",
  cta: { label: "Upload evidence", hrefSuffix: "/documents" },
};

const CONNECT_DROPBOX: StatusBarInfo = {
  bucket: "waiting_on_us",
  title: "Connect your Dropbox",
  // Short on purpose: this is the secondary strip and a long sentence pushes the real
  // "whose turn" message off a phone screen.
  description: "Keep your own copy of your evidence and signed demand letter.",
  cta: { label: "Connect Dropbox", hrefSuffix: "/documents" },
};

/** Activation Hero is gated: evidence first, then the questionnaire. */
export function needsOrganizeFirst(c: CaseRecord): boolean {
  return (
    c.service === "activation_hero" &&
    c.status === "paid_pending_claim_type_selection" &&
    !isOrganized(c)
  );
}

export function isResponseWindowExpired(c: Pick<CaseRecord, "mailing">, now: Date): boolean {
  return !!c.mailing && isExpired(c.mailing.responseWindowEndsAt, now);
}

/**
 * The single, always-visible status bar. Resolved in priority order:
 *  1. An expired response window turns the passive waiting period into a real action
 *     (the status never flips by itself when the deadline passes, so we derive it from time).
 *  2. Activation Hero customers must get organized before the questionnaire.
 *  3. Any other blocking action the status / open task already implies.
 *  4. The evidence-upload nudge, once Dropbox is connected but no file is attached.
 */
export function resolveStatusBar(c: CaseRecord, now: Date): StatusBarInfo {
  const base = baseInfo(c);

  if (base.bucket === "waiting_period" && isResponseWindowExpired(c, now)) return OUTCOME_NEEDED;

  if (needsOrganizeFirst(c)) return GET_ORGANIZED_FIRST;

  if (base.bucket === "waiting_on_client" || base.bucket === "done") return base;

  // Uploading a file requires Dropbox, so don't nudge before it's connected.
  if (needsEvidenceUpload(c) && c.dropbox.connected) {
    return { ...EVIDENCE_UPLOAD, bucket: base.bucket };
  }
  return base;
}

/** Secondary "connect Dropbox" strip, shown beneath the status bar. */
export function resolveDropboxBar(c: CaseRecord, statusBar: StatusBarInfo): StatusBarInfo | null {
  if (c.dropbox.connected) return null;
  if (statusBar.bucket === "done") return null;
  if (needsOrganizeFirst(c)) return null;
  return CONNECT_DROPBOX;
}

export function getBucket(c: CaseRecord, now: Date): Bucket {
  return resolveStatusBar(c, now).bucket;
}

/** Customer-facing label for the badge on list cards (same wording as production). */
export function getStatusLabel(c: CaseRecord, _now?: Date): string {
  return STATUS_META[c.status].label;
}

export function getStatusBadge(c: CaseRecord, _now?: Date): BadgeVariant {
  return STATUS_META[c.status].badge;
}

/**
 * Same palette as the production dashboard. `bar` is the solid status-bar fill (white text),
 * `ctaText` colours the white CTA button.
 * waiting_on_us is brand-500, not 600: the header is brand-600 and a same-colour bar directly
 * beneath it would read as one continuous block.
 */
export const BUCKET_STYLES: Record<
  Bucket,
  { bar: string; ctaText: string }
> = {
  waiting_on_client: { bar: "bg-amber-500", ctaText: "text-amber-700" },
  waiting_on_us: { bar: "bg-brand-500", ctaText: "text-brand-700" },
  waiting_period: { bar: "bg-green-600", ctaText: "text-green-700" },
  done: { bar: "bg-gray-500", ctaText: "text-gray-700" },
};
