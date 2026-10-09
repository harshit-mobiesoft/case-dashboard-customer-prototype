import { countWords } from "../words";
import type { IntakeFormData } from "./intake";

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const STATE_RE = /^[A-Za-z]{2}$/;
const COUNTRY_RE = /^[A-Za-z]{2}$/;

export const MAX_CLAIM_WORDS = 100;
export const MAX_SMALL_CLAIMS_AMOUNT = 25_000;

const digits = (v: string) => v.replace(/\D/g, "");
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());
// E.164: 7–15 digits covers US local numbers and international ones.
export const isValidPhone = (v: string) => digits(v).length >= 7 && digits(v).length <= 15;
const isUS = (country: string) => country.trim().toUpperCase() === "US";

export function validateClaimant(f: IntakeFormData): FieldErrors {
  const e: FieldErrors = {};
  if (!f.claimantName.trim()) e.claimantName = "Full legal name is required.";

  if (!f.claimantEmail.trim()) e.claimantEmail = "Email address is required.";
  else if (!isValidEmail(f.claimantEmail)) e.claimantEmail = "Enter a valid email address.";

  if (!f.claimantPhone.trim()) e.claimantPhone = "Phone number is required.";
  else if (!isValidPhone(f.claimantPhone)) e.claimantPhone = "Enter a valid 10-digit US phone number.";

  if (!f.claimantAddress.trim()) e.claimantAddress = "Street address is required.";
  if (!f.claimantCity.trim()) e.claimantCity = "City is required.";

  const us = isUS(f.claimantCountry || "US");
  if (!f.claimantState.trim()) e.claimantState = us ? "State is required." : "State / Province is required.";
  else if (us && !STATE_RE.test(f.claimantState.trim())) e.claimantState = "Enter a 2-letter state code (e.g. CA).";

  if (!f.claimantZip.trim()) e.claimantZip = us ? "ZIP code is required." : "Postal code is required.";
  else if (us && !ZIP_RE.test(f.claimantZip.trim())) e.claimantZip = "Enter a valid 5-digit ZIP code.";

  if (!f.claimantCountry.trim()) e.claimantCountry = "Country is required.";
  else if (!COUNTRY_RE.test(f.claimantCountry.trim())) e.claimantCountry = "Enter a 2-letter country code (e.g. US, CA, GB).";
  return e;
}

export function validateDefendant(f: IntakeFormData): FieldErrors {
  const e: FieldErrors = {};

  if (f.service === "activation_hero") {
    if (!f.platformId) e.platformName = "Please select the platform that deactivated you.";
    const email = f.platformAccountEmail.trim();
    const phone = f.platformAccountPhone.trim();
    if (!email && !phone) e.platformAccountEmail = "Enter the email or phone number on your account with this platform.";
    else if (email && !isValidEmail(email)) e.platformAccountEmail = "Enter a valid email address.";
    if (phone && !isValidPhone(phone)) e.platformAccountPhone = "Enter a valid phone number.";
    return e;
  }

  if (!f.defendantLegalName.trim()) {
    e.defendantLegalName = f.defendantType === "business" ? "Business legal name is required." : "Full legal name is required.";
  }

  if (!f.defendantExistingBusinessId) {
    const us = isUS(f.defendantCountry || "US");
    if (!f.defendantAddress.trim()) e.defendantAddress = "Street address is required.";
    if (!f.defendantCity.trim()) e.defendantCity = "City is required.";
    if (!f.defendantState.trim()) e.defendantState = us ? "State is required." : "State / Province is required.";
    else if (us && !STATE_RE.test(f.defendantState.trim())) e.defendantState = "Enter a 2-letter state code (e.g. CA).";
    if (!f.defendantZip.trim()) e.defendantZip = us ? "ZIP code is required." : "Postal code is required.";
    else if (us && !ZIP_RE.test(f.defendantZip.trim())) e.defendantZip = "Enter a valid 5-digit ZIP code.";
    if (!f.defendantCountry.trim()) e.defendantCountry = "Country is required.";
    else if (!COUNTRY_RE.test(f.defendantCountry.trim())) e.defendantCountry = "Enter a 2-letter country code (e.g. US, CA, GB).";
  }

  if (f.defendantEmail.trim() && !isValidEmail(f.defendantEmail)) e.defendantEmail = "Enter a valid email address.";
  if (f.defendantPhone.trim() && !isValidPhone(f.defendantPhone)) e.defendantPhone = "Enter a valid 10-digit US phone number.";
  return e;
}

export function validateFilingCourt(f: IntakeFormData): FieldErrors {
  return f.countyId ? {} : { countyId: "Please select a filing county before continuing." };
}

export function validateClaim(f: IntakeFormData, now: Date): FieldErrors {
  const e: FieldErrors = {};
  const ah = f.service === "activation_hero";

  if (f.claimCategories.length === 0) {
    e.claimCategories = ah ? "Please select at least one deactivation category." : "Please select a claim category.";
  }

  if (!f.incidentDate) {
    e.incidentDate = ah ? "Date of deactivation is required." : "Date of incident is required.";
  } else {
    const d = new Date(`${f.incidentDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) e.incidentDate = "Enter a valid date.";
    else if (d.getTime() > now.getTime()) {
      e.incidentDate = ah ? "Date of deactivation cannot be in the future." : "Date of incident cannot be in the future.";
    }
  }

  const amount = Number(f.claimAmount);
  if (!f.claimAmount.trim()) e.claimAmount = ah ? "Estimated lost earnings is required." : "Claim amount is required.";
  else if (Number.isNaN(amount) || amount <= 0) e.claimAmount = "Enter a valid amount greater than $0.";
  else if (!ah && amount > MAX_SMALL_CLAIMS_AMOUNT) e.claimAmount = "Amount exceeds the maximum for small claims ($25,000).";

  const words = countWords(f.claimDescription);
  if (!f.claimDescription.trim()) e.claimDescription = "Claim description is required.";
  else if (words > MAX_CLAIM_WORDS) {
    e.claimDescription = `Description must be at most ${MAX_CLAIM_WORDS} words (${words} so far — please shorten).`;
  }

  if (f.hasEvidenceToUpload === null) e.hasEvidenceToUpload = "Please select whether you have evidence to upload.";
  if (!f.mailingPref) e.mailingPref = "Please select a mailing method.";
  return e;
}
