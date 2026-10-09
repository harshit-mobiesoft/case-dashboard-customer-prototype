// Turns a completed, paid intake into the case the customer then sees on their dashboard.

import { CATEGORY_TO_CLAIM_TYPE, PLATFORMS } from "./directory";
import { countyById } from "./counties";
import type { IntakeFormData } from "./intake";
import { parseUsdToCents } from "./money";
import type { ActivityEntry, CaseRecord } from "./types";

/** Next free case number for a service, continuing the existing sequence. */
export function nextReference(service: IntakeFormData["service"], existingRefs: string[]): string {
  const prefix = service === "activation_hero" ? "AH" : "SC";
  const floor = service === "activation_hero" ? 30_000 : 20_000;
  const max = existingRefs
    .filter((r) => r.startsWith(`${prefix}-`))
    .map((r) => Number(r.slice(prefix.length + 1)))
    .filter(Number.isFinite)
    .reduce((a, b) => Math.max(a, b), floor);
  return `${prefix}-${max + 1}`;
}

/** Tolerates an empty/invalid date (validation is optional in the prototype). */
function parseIncidentDate(value: string, now: Date): string {
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? now.toISOString() : d.toISOString();
}

export function buildCaseFromIntake(
  form: IntakeFormData,
  ctx: { existingRefs: string[]; now: Date },
): CaseRecord {
  const ah = form.service === "activation_hero";
  const referenceCode = nextReference(form.service, ctx.existingRefs);
  const id = `case-${referenceCode.toLowerCase()}`;
  const at = ctx.now.toISOString();

  const county = countyById(form.countyId);
  const platform = PLATFORMS.find((p) => p.id === form.platformId);
  const cents = parseUsdToCents(form.claimAmount);

  const defendant = ah
    ? {
        name: form.platformName || platform?.name || "Platform",
        address: platform?.address ?? { line1: "", city: "", state: "", zip: "" },
      }
    : {
        name: form.defendantLegalName.trim() || "Unnamed defendant",
        address: {
          line1: form.defendantAddress.trim(),
          city: form.defendantCity.trim(),
          state: form.defendantState.trim().toUpperCase(),
          zip: form.defendantZip.trim(),
        },
      };

  const activity: ActivityEntry[] = [{ id: `${id}-a1`, type: "case_created", at }];

  return {
    id,
    referenceCode,
    service: form.service,
    status: ah ? "paid_pending_claim_type_selection" : "paid_pending_letter_review",
    claimType: ah ? null : (CATEGORY_TO_CLAIM_TYPE[form.claimCategories[0] ?? ""] ?? "other"),
    amountCents: typeof cents === "number" ? cents : 0,
    incidentDate: parseIncidentDate(form.incidentDate, ctx.now),
    description: form.claimDescription.trim(),
    county: county
      ? { name: county.name, state: county.state }
      : { name: form.countyName.split(",")[0]?.trim() || "Unknown County", state: form.countyState },
    defendant,
    mailingMethod: form.mailingPref ?? "first_class",
    hasEvidenceToUpload: form.hasEvidenceToUpload,
    evidence: [],
    dropbox: { connected: false, accountEmail: null, connectedAt: null },
    questionnaire: null,
    letter: { versions: [], signedAt: null, signedName: null },
    revisionRequest: null,
    mailing: null,
    outcome: null,
    reminderEnabled: false,
    tasks: [],
    activity,
    createdAt: at,
    updatedAt: at,
  };
}
