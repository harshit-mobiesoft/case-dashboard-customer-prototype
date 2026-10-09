import type {
  ActivityType,
  ClaimType,
  EvidenceType,
  MailingMethod,
  Service,
  SettlementResolution,
} from "./types";

export const SERVICE_LABELS: Record<Service, string> = {
  small_claims: "Small Claims Hero",
  activation_hero: "Activation Hero",
};

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  property_damage: "Property Damage",
  contract_dispute: "Contract Dispute",
  landlord_tenant: "Landlord/Tenant",
  consumer_dispute: "Consumer Dispute",
  unpaid_loan: "Unpaid Loan",
  wrongful_deactivation: "Wrongful Deactivation",
  unpaid_earnings: "Unpaid Earnings",
  other: "Other",
};

/** Shown while an Activation Hero case hasn't had its claim type selected yet. */
export const CLAIM_TYPE_PENDING_LABEL = "Claim type pending";

export const MAILING_METHOD_LABELS: Record<MailingMethod, string> = {
  first_class: "First class mail",
  certified: "Certified mail",
};

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  receipt: "Receipt",
  photo: "Photo",
  screenshot: "Screenshot",
  contract: "Contract / agreement",
  message: "Message / email",
  other: "Other",
};

export const RESOLUTION_LABELS: Record<SettlementResolution, string> = {
  full_payment_received: "Full payment",
  partial_payment_agreed: "Partial payment",
  non_monetary_resolution: "Non-monetary",
};

// Customer-facing activity feed copy. Typed as a full Record so a new ActivityType
// can't ship without wording.
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  case_created: "Case created",
  dropbox_connected: "Connected Dropbox for evidence uploads",
  dropbox_disconnected: "Disconnected Dropbox",
  evidence_added: "Added an evidence item",
  evidence_updated: "Updated an evidence item",
  evidence_removed: "Removed an evidence item",
  questionnaire_submitted: "Submitted the claim questionnaire",
  claim_type_selected: "Claim type selected by our team",
  letter_sent_for_signature: "Demand letter sent to you for signature",
  revision_requested: "Requested a revision to your demand letter",
  letter_revised: "Our team revised your demand letter",
  letter_signed: "Signed your demand letter",
  letter_mailed: "Demand letter sent for mailing",
  outcome_settled: "Marked case outcome as settled",
  phase2_unlocked: "Started the court filing process",
  task_submitted: "Submitted a court filing step",
  task_approved: "A court filing step was approved",
  task_rejected: "A court filing step needs changes",
  case_closed: "Closed the case",
};
