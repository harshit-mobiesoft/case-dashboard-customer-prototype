import type { Profile } from "./types";

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

export type ProfileErrors = Partial<Record<"firstName" | "lastName" | "phone" | "line1" | "city" | "state" | "zip", string>>;

export function validateProfile(p: Profile): ProfileErrors {
  const errors: ProfileErrors = {};
  if (p.firstName.trim() === "") errors.firstName = "First name is required.";
  if (p.lastName.trim() === "") errors.lastName = "Last name is required.";
  if (p.phone.replace(/\D/g, "").length !== 10) errors.phone = "Enter a 10-digit US phone number.";
  if (p.address.line1.trim() === "") errors.line1 = "Street address is required.";
  if (p.address.city.trim() === "") errors.city = "City is required.";
  if (!(US_STATES as readonly string[]).includes(p.address.state)) errors.state = "Choose a state.";
  if (!/^\d{5}(-\d{4})?$/.test(p.address.zip.trim())) errors.zip = "Enter a 5-digit ZIP code.";
  return errors;
}

export function normalizeProfile(p: Profile): Profile {
  return {
    ...p,
    firstName: p.firstName.trim(),
    lastName: p.lastName.trim(),
    phone: p.phone.replace(/\D/g, ""),
    address: {
      line1: p.address.line1.trim(),
      city: p.address.city.trim(),
      state: p.address.state,
      zip: p.address.zip.trim(),
    },
  };
}
