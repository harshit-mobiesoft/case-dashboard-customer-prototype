import type { CaseRecord, ClaimType, EvidenceType } from "./types";

export interface EvidenceSuggestion {
  title: string;
  type: EvidenceType;
}

const SUGGESTIONS: Record<ClaimType | "default", EvidenceSuggestion[]> = {
  property_damage: [
    { title: "Photos of the damage", type: "photo" },
    { title: "Repair estimate or invoice", type: "receipt" },
    { title: "Messages admitting fault", type: "message" },
  ],
  contract_dispute: [
    { title: "Signed contract or agreement", type: "contract" },
    { title: "Proof of payment", type: "receipt" },
    { title: "Emails or texts about the work", type: "message" },
  ],
  landlord_tenant: [
    { title: "Lease agreement", type: "contract" },
    { title: "Move-in / move-out photos", type: "photo" },
    { title: "Proof of deposit payment", type: "receipt" },
  ],
  consumer_dispute: [
    { title: "Order confirmation or receipt", type: "receipt" },
    { title: "Chat or email with the seller", type: "screenshot" },
    { title: "Photos of the product", type: "photo" },
  ],
  unpaid_loan: [
    { title: "Written repayment agreement", type: "contract" },
    { title: "Proof you sent the money", type: "receipt" },
    { title: "Texts about repayment", type: "message" },
  ],
  wrongful_deactivation: [
    { title: "Deactivation notice", type: "screenshot" },
    { title: "Recent earnings statements", type: "other" },
    { title: "Appeal attempts and replies", type: "message" },
  ],
  unpaid_earnings: [
    { title: "Earnings statements", type: "other" },
    { title: "Payout history", type: "screenshot" },
    { title: "Messages with support", type: "message" },
  ],
  other: [
    { title: "Anything in writing about the dispute", type: "message" },
    { title: "Receipts or proof of loss", type: "receipt" },
    { title: "Photos or screenshots", type: "photo" },
  ],
  default: [
    { title: "Anything in writing about the dispute", type: "message" },
    { title: "Receipts or proof of loss", type: "receipt" },
    { title: "Photos or screenshots", type: "photo" },
  ],
};

/** Stand-in for the production "AI suggests what to gather" feature. Excludes what's already logged. */
export function getEvidenceSuggestions(c: Pick<CaseRecord, "claimType" | "evidence">): EvidenceSuggestion[] {
  const pool = SUGGESTIONS[c.claimType ?? "default"];
  const have = new Set(c.evidence.map((e) => e.title.trim().toLowerCase()));
  return pool.filter((s) => !have.has(s.title.toLowerCase()));
}
