// Builds the vertical timelines shown on the case page. Pure data — the components only
// render it, so the logic is unit-testable and the three phases share one renderer.

import { MAILING_METHOD_LABELS } from "./labels";
import { isOrganized } from "./evidence";
import { routes } from "./routes";
import { isResponseWindowExpired } from "./status";
import { isStrict } from "./strict";
import { daysRemaining } from "./time";
import type { CaseRecord, CourtTask } from "./types";

export type StepState = "complete" | "active" | "pending" | "internal";

export type StepIcon =
  | "check"
  | "folder"
  | "clipboard"
  | "star"
  | "signature"
  | "send"
  | "clock"
  | "outcome"
  | "file"
  | "card"
  | "mail"
  | "calendar"
  | "gavel";

export type StepAction =
  | { kind: "link"; label: string; href: string }
  | { kind: "command"; label: string; command: "send_mailing" };

export interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  icon: StepIcon;
  state: StepState;
  action?: StepAction;
  /** Optional note rendered under the description (e.g. a reviewer's feedback). */
  note?: { tone: "danger" | "neutral"; text: string };
}

type FormatDate = (iso: string) => string;

export function getLetterSteps(c: CaseRecord, formatDate: FormatDate): TimelineStep[] {
  const organized = isOrganized(c);
  const isAH = c.service === "activation_hero";
  const questionnaireDone = c.questionnaire !== null || c.status !== "paid_pending_claim_type_selection";
  const letterDrafting =
    c.status === "paid_pending_claim_type_selection" ||
    c.status === "paid_pending_letter_review" ||
    c.status === "letter_revision_requested";

  const evidenceSummary =
    c.evidence.length > 0
      ? `${c.evidence.length} piece${c.evidence.length === 1 ? "" : "s"} of evidence logged`
      : c.hasEvidenceToUpload === false
        ? "No evidence to add"
        : null;

  const organizeDescription = !organized
    ? c.dropbox.connected
      ? "Dropbox connected. Now add your evidence or confirm you have none."
      : c.evidence.length > 0
        ? "Connect your Dropbox to continue. Your evidence is stored there."
        : "Start by connecting your free Dropbox, then add your evidence or confirm you have none."
    : c.dropbox.connected
      ? ["Dropbox connected", evidenceSummary].filter(Boolean).join(" · ")
      : `${evidenceSummary}. Connect your free Dropbox so you have a copy of your evidence and letter for your records.`;

  const steps: TimelineStep[] = [
    {
      id: "intake",
      label: "Intake complete",
      description: "Your information and claim details have been submitted.",
      icon: "check",
      state: "complete",
    },
    {
      id: "organize",
      label: "Get organized",
      description: organizeDescription,
      icon: "folder",
      state: organized ? "complete" : "active",
      action: {
        kind: "link",
        label: organized ? "Manage →" : "Get organized →",
        href: routes.documents(c.id),
      },
    },
  ];

  if (isAH) {
    const needed = c.status === "paid_pending_claim_type_selection";
    steps.push({
      id: "questionnaire",
      label: "Answer a few quick questions",
      description: needed
        ? "Help our team prepare your demand letter by answering a few questions."
        : "Questionnaire submitted — our team selected the best claim type.",
      icon: "clipboard",
      state: questionnaireDone ? "complete" : organized ? "active" : "pending",
      action:
        // In strict mode the questionnaire waits until the customer is organized; the prototype never blocks.
        needed && (organized || !isStrict())
          ? { kind: "link", label: "Start questionnaire →", href: routes.questionnaire(c.id) }
          : undefined,
    });
  }

  steps.push(
    {
      id: "drafting",
      label: "Letter prepared by our team",
      description: letterDrafting
        ? c.status === "letter_revision_requested"
          ? "We're applying the changes you asked for."
          : "Our team is preparing your demand letter."
        : "Your demand letter was prepared by our team.",
      icon: "star",
      state: letterDrafting ? "internal" : "complete",
    },
    {
      id: "sign",
      label: "Review and sign",
      description: c.letter.signedAt
        ? `Signed on ${formatDate(c.letter.signedAt)}.`
        : c.status === "letter_signature_sent"
          ? "Your letter is ready — review it and sign when you're happy with it."
          : c.status === "letter_revision_requested"
            ? "You'll sign the updated letter once our team sends it back."
            : "You will e-sign your demand letter after it's prepared.",
      icon: "signature",
      state:
        c.status === "letter_signature_sent"
          ? "active"
          : c.letter.signedAt
            ? "complete"
            : "pending",
      action:
        c.status === "letter_signature_sent"
          ? { kind: "link", label: "View letter →", href: routes.review(c.id) }
          : undefined,
    },
    {
      id: "sent",
      label: "Letter sent to defendant",
      description: c.mailing
        ? `Mailed on ${formatDate(c.mailing.sentAt)} via ${MAILING_METHOD_LABELS[c.mailing.method].toLowerCase()}.`
        : c.status === "letter_signed"
          ? "Your letter is signed and ready — click Send to dispatch it."
          : `We send by ${MAILING_METHOD_LABELS[c.mailingMethod].toLowerCase()} after you sign.`,
      icon: "send",
      state: c.mailing ? "complete" : c.status === "letter_signed" ? "active" : "pending",
      action:
        c.status === "letter_signed"
          ? { kind: "command", label: "Send letter →", command: "send_mailing" }
          : undefined,
    },
  );

  return steps;
}

export function getResponseSteps(c: CaseRecord, now: Date, formatDate: FormatDate): TimelineStep[] {
  const deadline = c.mailing?.responseWindowEndsAt ?? null;
  const open = deadline !== null && !isResponseWindowExpired(c, now);
  const outcomeMarked = c.outcome !== null;
  const expired = c.mailing !== null && !open;

  const windowDescription = !deadline
    ? "Starts when your letter is mailed."
    : outcomeMarked
      ? open
        ? `Closed early — outcome marked before the ${formatDate(deadline)} deadline.`
        : `Window closed on ${formatDate(deadline)}`
      : open
        ? `${daysRemaining(deadline, now)} days remaining — deadline ${formatDate(deadline)}`
        : `Window closed on ${formatDate(deadline)}`;

  const outcomeLabel =
    c.outcome?.type === "settled"
      ? "Settled — case closed"
      : c.outcome?.type === "no_response"
        ? "No response — proceeding to court"
        : c.outcome?.type === "unsatisfactory"
          ? "Unsatisfactory response — proceeding to court"
          : "Mark the outcome";

  return [
    {
      id: "window",
      label: "21-day response window",
      description: windowDescription,
      icon: "clock",
      state: outcomeMarked ? "complete" : c.mailing ? "active" : "pending",
      action:
        c.mailing && open && !outcomeMarked
          ? { kind: "link", label: "Mark early →", href: routes.outcome(c.id) }
          : undefined,
    },
    {
      id: "outcome",
      label: outcomeLabel,
      description: outcomeMarked ? undefined : "Tell us what happened — this unlocks the next phase.",
      icon: "outcome",
      state: outcomeMarked ? "complete" : expired ? "active" : "pending",
      action:
        expired && !outcomeMarked
          ? { kind: "link", label: "Mark outcome →", href: routes.outcome(c.id) }
          : undefined,
    },
  ];
}

const TASK_ICONS: Record<CourtTask["type"], StepIcon> = {
  form_online: "file",
  fee_online: "card",
  serve_mail: "mail",
  court_date: "calendar",
  hearing: "gavel",
};

export function getCourtSteps(c: CaseRecord): TimelineStep[] {
  return c.tasks.map((task) => ({
    id: task.id,
    label: task.title,
    description:
      task.status === "submitted"
        ? "Submitted — our team is reviewing it."
        : task.status === "approved"
          ? "Approved."
          : task.status === "locked"
            ? "Unlocks after the previous step is approved."
            : task.instructions,
    icon: TASK_ICONS[task.type],
    state:
      task.status === "approved"
        ? "complete"
        : task.status === "unlocked" || task.status === "rejected"
          ? "active"
          : task.status === "submitted"
            ? "internal"
            : "pending",
    note:
      task.status === "rejected" && task.reviewNote
        ? { tone: "danger", text: task.reviewNote }
        : undefined,
  }));
}
