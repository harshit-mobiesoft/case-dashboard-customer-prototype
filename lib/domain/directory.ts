import type { Address } from "./types";

export interface Platform {
  id: string;
  name: string;
  address: Address;
}

export const PLATFORMS: Platform[] = [
  { id: "uber", name: "Uber Technologies, Inc.", address: { line1: "1725 3rd Street", city: "San Francisco", state: "CA", zip: "94158" } },
  { id: "lyft", name: "Lyft, Inc.", address: { line1: "185 Berry Street, Suite 5000", city: "San Francisco", state: "CA", zip: "94107" } },
  { id: "doordash", name: "DoorDash, Inc.", address: { line1: "303 2nd Street, South Tower, 8th Floor", city: "San Francisco", state: "CA", zip: "94107" } },
  { id: "instacart", name: "Maplebear Inc. (Instacart)", address: { line1: "50 Beale Street, Suite 600", city: "San Francisco", state: "CA", zip: "94105" } },
  { id: "grubhub", name: "Grubhub Holdings Inc.", address: { line1: "111 W Washington Street, Suite 2100", city: "Chicago", state: "IL", zip: "60602" } },
  { id: "amazon-flex", name: "Amazon Flex (Amazon.com Services LLC)", address: { line1: "410 Terry Avenue North", city: "Seattle", state: "WA", zip: "98109" } },
  { id: "ubereats", name: "Uber Eats (Uber Technologies, Inc.)", address: { line1: "1725 3rd Street", city: "San Francisco", state: "CA", zip: "94158" } },
  { id: "shipt", name: "Shipt, Inc.", address: { line1: "500 Beacon Parkway West", city: "Birmingham", state: "AL", zip: "35209" } },
  { id: "taskrabbit", name: "TaskRabbit, Inc.", address: { line1: "425 Market Street, Suite 1600", city: "San Francisco", state: "CA", zip: "94105" } },
  { id: "rideshare-demo", name: "RideNow Technologies, Inc.", address: { line1: "1 Market Plaza, Suite 400", city: "San Francisco", state: "CA", zip: "94105" } },
];

export interface Business {
  id: string;
  name: string;
  address: Address;
}

/** "Existing business defendants" the production app offers as autocomplete. */
export const BUSINESSES: Business[] = [
  { id: "biz-brightside", name: "Brightside Remodeling LLC", address: { line1: "902 Industrial Way", city: "Elk Grove", state: "CA", zip: "95757" } },
  { id: "biz-techbargains", name: "TechBargains Online Inc.", address: { line1: "55 Commerce Drive", city: "Reno", state: "NV", zip: "89501" } },
  { id: "biz-swifthaul", name: "SwiftHaul Movers", address: { line1: "300 Depot St", city: "Stockton", state: "CA", zip: "95202" } },
  { id: "biz-pinecrest", name: "Pinecrest Property Management", address: { line1: "2210 K Street", city: "Sacramento", state: "CA", zip: "95816" } },
  { id: "biz-brightsmile", name: "BrightSmile Dental Group", address: { line1: "640 Elm Street", city: "Davis", state: "CA", zip: "95616" } },
  { id: "biz-pixelcraft", name: "PixelCraft Studio LLC", address: { line1: "4100 Wilshire Blvd", city: "Los Angeles", state: "CA", zip: "90010" } },
];

export interface CategoryItem {
  value: string;
  desc: string;
}

export const SMALL_CLAIMS_CATEGORIES: CategoryItem[] = [
  { value: "Money owed", desc: "Debt, loan, unpaid invoice, bad check" },
  { value: "Broken contract", desc: "Services or goods not delivered" },
  { value: "Property damage", desc: "Auto or other property" },
  { value: "Landlord-tenant", desc: "Security deposit, habitability, rent" },
  { value: "Consumer dispute", desc: "Defective product, false advertising, refund" },
  { value: "Get my belongings back", desc: "Property wrongfully held" },
  { value: "Other", desc: "Doesn't fit the categories above" },
];

export const ACTIVATION_HERO_CATEGORIES: CategoryItem[] = [
  { value: "False claim by customer or passenger", desc: "Wrongful complaint triggered deactivation" },
  { value: "Performance metric issue", desc: "Acceptance rate, completion rate, on-time" },
  { value: "Background check or document problem", desc: "Incorrect or outdated background check" },
  { value: "Alleged safety or TOS violation", desc: "Disputed violation claim" },
  { value: "Retaliation", desc: "Deactivated after complaint, report, or organizing" },
  { value: "No reason given", desc: "Unclear or opaque deactivation" },
  { value: "Other deactivation reason", desc: "Doesn't fit the categories above" },
];

/** Same label → claim_type mapping the production intake uses. */
export const CATEGORY_TO_CLAIM_TYPE: Record<string, import("./types").ClaimType> = {
  "Money owed": "unpaid_loan",
  "Broken contract": "contract_dispute",
  "Property damage": "property_damage",
  "Landlord-tenant": "landlord_tenant",
  "Consumer dispute": "consumer_dispute",
  "Get my belongings back": "other",
  Other: "other",
};

export const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "MX", label: "Mexico" },
];
