// Intake form model. Mirrors the production wizard (`/smallclaimshero`, `/activationhero`):
// 7 internal steps, 6 visible in the stepper, steps 6 (upgrade mail) and 7 (payment) share "Payment".

import { format } from "date-fns";
import { subtractDays } from "./time";
import type { MailingMethod, Profile, Service } from "./types";

export interface IntakeFormData {
  service: Service;

  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  claimantCountry: string;
  claimantAddress: string;
  claimantCity: string;
  claimantState: string;
  claimantZip: string;

  // Small Claims defendant
  defendantType: "individual" | "business";
  defendantLegalName: string;
  defendantRegisteredAgent: string;
  defendantExistingBusinessId: string | null;
  defendantCountry: string;
  defendantAddress: string;
  defendantCity: string;
  defendantState: string;
  defendantZip: string;
  defendantEmail: string;
  defendantPhone: string;

  // Activation Hero defendant (a platform)
  platformId: string;
  platformName: string;
  platformAccountEmail: string;
  platformAccountPhone: string;

  countyId: string;
  countyName: string;
  countyState: string;

  claimCategories: string[];
  incidentDate: string;
  claimAmount: string;
  claimDescription: string;
  hasEvidenceToUpload: boolean | null;
  mailingPref: MailingMethod | null;
}

export function emptyIntakeForm(service: Service, profile?: Profile | null): IntakeFormData {
  return {
    service,
    claimantName: profile ? `${profile.firstName} ${profile.lastName}` : "",
    claimantEmail: profile?.email ?? "",
    claimantPhone: profile?.phone ?? "",
    claimantCountry: "US",
    claimantAddress: profile?.address.line1 ?? "",
    claimantCity: profile?.address.city ?? "",
    claimantState: profile?.address.state ?? "",
    claimantZip: profile?.address.zip ?? "",
    defendantType: "business",
    defendantLegalName: "",
    defendantRegisteredAgent: "",
    defendantExistingBusinessId: null,
    defendantCountry: "US",
    defendantAddress: "",
    defendantCity: "",
    defendantState: "",
    defendantZip: "",
    defendantEmail: "",
    defendantPhone: "",
    platformId: "",
    platformName: "",
    platformAccountEmail: "",
    platformAccountPhone: "",
    countyId: "",
    countyName: "",
    countyState: "",
    claimCategories: [],
    incidentDate: "",
    claimAmount: "",
    claimDescription: "",
    hasEvidenceToUpload: null,
    mailingPref: null,
  };
}

/**
 * Prototype default: every field pre-populated with realistic sample data (including the county and
 * mailing choice), so a walkthrough is just "Continue" all the way to checkout.
 * `?validate=1` on the intake URL switches back to a blank form with blocking validation.
 */
export function demoIntakeForm(service: Service, profile: Profile, now: Date): IntakeFormData {
  const base = emptyIntakeForm(service, profile);
  const incidentDate = format(subtractDays(now, 30), "yyyy-MM-dd");
  if (service === "activation_hero") {
    return {
      ...base,
      platformId: "uber",
      platformName: "Uber Technologies, Inc.",
      defendantLegalName: "Uber Technologies, Inc.",
      platformAccountEmail: profile.email,
      platformAccountPhone: profile.phone,
      countyId: "sacramento-ca",
      countyName: "Sacramento County, CA",
      countyState: "CA",
      claimCategories: ["No reason given"],
      incidentDate,
      claimAmount: "3200",
      claimDescription:
        "My driver account was deactivated without any explanation. I had a 4.9 rating and completed over 2,000 trips. I appealed twice and only received automated replies.",
      hasEvidenceToUpload: false,
      mailingPref: "certified",
    };
  }
  return {
    ...base,
    defendantType: "business",
    defendantLegalName: "Brightside Remodeling LLC",
    defendantExistingBusinessId: "biz-brightside",
    defendantAddress: "902 Industrial Way",
    defendantCity: "Elk Grove",
    defendantState: "CA",
    defendantZip: "95757",
    countyId: "sacramento-ca",
    countyName: "Sacramento County, CA",
    countyState: "CA",
    claimCategories: ["Broken contract"],
    incidentDate,
    claimAmount: "1850",
    claimDescription:
      "I paid a $1,850 deposit for a kitchen remodel. The work never started and the contractor stopped answering my calls and emails.",
    hasEvidenceToUpload: false,
    mailingPref: "first_class",
  };
}

/** What the backend calls `current_step` — what a saved draft says is "next". */
export type IntakeStepKey =
  | "customer_information"
  | "defendant_information"
  | "claim_information"
  | "review"
  | "payment";

export const INTAKE_STEP_LABELS: Record<IntakeStepKey, string> = {
  customer_information: "Your information",
  defendant_information: "Defendant information",
  claim_information: "Claim details",
  review: "Review & payment",
  payment: "Payment",
};

export const INTAKE_SERVICE_PATHS: Record<Service, string> = {
  small_claims: "/smallclaimshero",
  activation_hero: "/activationhero",
};

export const INTAKE_NAV_STEPS = [
  { label: "Your information" },
  { label: "Defendant information" },
  { label: "Filing court" },
  { label: "Your claim" },
  { label: "Review" },
  { label: "Payment" },
] as const;

/** Activation Hero hides "Filing court" (auto-detected) so its stepper has five entries. */
export function visibleSteps(service: Service) {
  return service === "activation_hero"
    ? INTAKE_NAV_STEPS.filter((s) => s.label !== "Filing court")
    : INTAKE_NAV_STEPS;
}

/** Internal step (1–7) → index in the visible stepper. */
export function toNavStep(step: number, service: Service): number {
  if (service === "activation_hero") {
    if (step === 7) return 4;
    if (step === 6) return 3;
    if (step <= 2) return step - 1;
    if (step === 3) return 2; // fallback filing-court shows "Your claim" as active
    return step - 2;
  }
  if (step === 7) return 5;
  if (step === 6) return 4;
  return step - 1;
}

/** Nav index → internal step it navigates back to. */
export function fromNavIndex(index: number, service: Service): number {
  return service === "activation_hero" && index >= 2 ? index + 2 : index + 1;
}

export function stepForKey(key: IntakeStepKey, form: IntakeFormData): number {
  switch (key) {
    case "customer_information":
      return 1;
    case "defendant_information":
      return 2;
    case "claim_information":
      return form.service === "activation_hero" && form.countyId ? 4 : 3;
    case "review":
      return 5;
    case "payment":
      return 7;
  }
}

export function keyForStep(step: number): IntakeStepKey {
  if (step <= 1) return "customer_information";
  if (step === 2) return "defendant_information";
  if (step <= 4) return "claim_information";
  if (step <= 6) return "review";
  return "payment";
}
