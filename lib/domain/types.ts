// Domain model for the customer-side Case Dashboard prototype.
//
// Status names intentionally match the production API's `claims.status` values so
// the prototype can later be pointed at the real backend without renaming. Only the
// subset that produces a distinct *customer* experience is modelled.

export type Service = "small_claims" | "activation_hero";

export const CLAIM_STATUSES = [
  // Activation Hero only: customer must get organized + answer the questionnaire.
  "paid_pending_claim_type_selection",
  "paid_pending_letter_review",
  "letter_revision_requested",
  "letter_signature_sent",
  "letter_signed",
  "mailed",
  "phase2_unlocked",
  "phase2_in_progress",
  "phase2_completed",
  "closed",
] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export type MailingMethod = "first_class" | "certified";

export type ClaimType =
  | "property_damage"
  | "contract_dispute"
  | "landlord_tenant"
  | "consumer_dispute"
  | "unpaid_loan"
  | "wrongful_deactivation"
  | "unpaid_earnings"
  | "other";

export interface Address {
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface County {
  name: string;
  state: string;
}

export interface Defendant {
  name: string;
  address: Address;
}

// ─── Letter ───────────────────────────────────────────────────────────────────

export type LetterVersionSource = "system_generated" | "agent_edit";

export interface LetterVersion {
  id: string;
  number: number;
  source: LetterVersionSource;
  createdAt: string;
}

export interface Letter {
  versions: LetterVersion[];
  signedAt: string | null;
  signedName: string | null;
}

export const REVISION_REASONS = [
  "Incorrect dates",
  "Wrong amount",
  "Wrong defendant name",
  "Missing details",
  "Incorrect address",
  "Tone / wording",
  "Other",
] as const;

export type RevisionReason = (typeof REVISION_REASONS)[number];

export interface RevisionRequest {
  reasons: RevisionReason[];
  details: string;
  requestedAt: string;
}

// ─── Mailing & outcome ───────────────────────────────────────────────────────

export interface Mailing {
  sentAt: string;
  responseWindowEndsAt: string;
  method: MailingMethod;
  trackingNumber: string | null;
}

export type OutcomeType = "settled" | "no_response" | "unsatisfactory";
export type SettlementResolution =
  | "full_payment_received"
  | "partial_payment_agreed"
  | "non_monetary_resolution";

export const UNSATISFACTORY_ISSUES = [
  "Offer too low",
  "Partial payment only",
  "Promised but hasn't paid",
] as const;

export interface Outcome {
  type: OutcomeType;
  resolution: SettlementResolution | null;
  issues: string[];
  amountReceivedCents: number | null;
  markedAt: string;
}

// ─── Evidence & Dropbox ──────────────────────────────────────────────────────

export const EVIDENCE_TYPES = [
  "receipt",
  "photo",
  "screenshot",
  "contract",
  "message",
  "other",
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export interface EvidenceFile {
  id: string;
  name: string;
  sizeBytes: number;
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: EvidenceType;
  notes: string;
  files: EvidenceFile[];
  createdAt: string;
}

export interface DropboxConnection {
  connected: boolean;
  accountEmail: string | null;
  connectedAt: string | null;
}

// ─── Questionnaire (Activation Hero) ─────────────────────────────────────────

export interface QuestionnaireSubmission {
  /** Skipped questions are omitted, same as the production API. */
  answers: Record<string, boolean>;
  submittedAt: string;
}

// ─── Court filing (phase 3) ──────────────────────────────────────────────────

export type TaskStatus = "locked" | "unlocked" | "submitted" | "approved" | "rejected";
export type TaskType = "form_online" | "fee_online" | "serve_mail" | "court_date" | "hearing";

export interface TaskSubmission {
  submittedAt: string;
  fields: Record<string, string>;
}

export interface CourtTask {
  id: string;
  order: number;
  title: string;
  type: TaskType;
  instructions: string;
  externalUrl: string | null;
  status: TaskStatus;
  submission: TaskSubmission | null;
  /** Reviewer's note shown to the customer when a step is rejected. */
  reviewNote: string | null;
  approvedAt: string | null;
}

// ─── Activity ────────────────────────────────────────────────────────────────

export const ACTIVITY_TYPES = [
  "case_created",
  "dropbox_connected",
  "dropbox_disconnected",
  "evidence_added",
  "evidence_updated",
  "evidence_removed",
  "questionnaire_submitted",
  "claim_type_selected",
  "letter_sent_for_signature",
  "revision_requested",
  "letter_revised",
  "letter_signed",
  "letter_mailed",
  "outcome_settled",
  "phase2_unlocked",
  "task_submitted",
  "task_approved",
  "task_rejected",
  "case_closed",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  at: string;
}

// ─── Case ────────────────────────────────────────────────────────────────────

export interface CaseRecord {
  id: string;
  referenceCode: string;
  service: Service;
  status: ClaimStatus;
  /** Null until an Activation Hero case has been through the questionnaire. */
  claimType: ClaimType | null;
  amountCents: number;
  incidentDate: string;
  description: string;
  county: County;
  defendant: Defendant;
  mailingMethod: MailingMethod;
  /** `null` = customer hasn't said yet; `false` = confirmed they have none. */
  hasEvidenceToUpload: boolean | null;
  evidence: EvidenceItem[];
  dropbox: DropboxConnection;
  questionnaire: QuestionnaireSubmission | null;
  letter: Letter;
  revisionRequest: RevisionRequest | null;
  mailing: Mailing | null;
  outcome: Outcome | null;
  reminderEnabled: boolean;
  /** Scenario-only cases: reachable from the demo panel, but not listed on "My cases". */
  hiddenFromDashboard?: boolean;
  tasks: CourtTask[];
  activity: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

// ─── Account-level ───────────────────────────────────────────────────────────

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
}

export interface DraftApplication {
  id: string;
  service: Service;
  updatedAt: string;
  /** Human label of the intake step the customer stopped on. */
  nextStepLabel: string;
  /** Saved intake answers; absent on legacy drafts, which resume from a blank form. */
  form?: import("./intake").IntakeFormData;
  currentStep?: import("./intake").IntakeStepKey;
}

export interface DemoState {
  version: 1;
  seededAt: string;
  profile: Profile;
  cases: CaseRecord[];
  drafts: DraftApplication[];
  /** Cases found by email on first load — drives the "we linked N cases" banner. */
  autoLinkedCount: number;
}
