// The demand letter is structured data rendered as React nodes — never an HTML string —
// so there is no dangerouslySetInnerHTML anywhere in the prototype.

import { CLAIM_TYPE_LABELS } from "./labels";
import type { CaseRecord, LetterVersion, Profile } from "./types";
import { formatCurrency, formatDate, formatLongDate } from "../format";

export interface LetterContent {
  versionNumber: number;
  dateLine: string;
  sender: string[];
  recipient: string[];
  subject: string;
  paragraphs: string[];
  closing: string;
  /** Present once signed. */
  signedName: string | null;
  signedOn: string | null;
}

function fullName(p: Profile): string {
  return `${p.firstName} ${p.lastName}`;
}

function addressLines(a: { line1: string; city: string; state: string; zip: string }): string[] {
  return [a.line1, `${a.city}, ${a.state} ${a.zip}`];
}

export function buildLetter(c: CaseRecord, profile: Profile, version: LetterVersion): LetterContent {
  const claimLabel = c.claimType ? CLAIM_TYPE_LABELS[c.claimType] : "Claim";
  const amount = formatCurrency(c.amountCents / 100);
  const incident = formatLongDate(c.incidentDate);

  const body =
    c.service === "activation_hero"
      ? [
          `I am writing regarding the deactivation of my account on or about ${incident}. I believe the deactivation was made without adequate notice, a stated reason, or a meaningful opportunity to respond.`,
          c.description,
          `As a result I have suffered financial loss, which I calculate at ${amount}. This amount reflects the earnings I would reasonably have received had my account remained active, along with funds owed to me at the time of deactivation.`,
        ]
      : [
          `I am writing regarding a dispute that arose on or about ${incident}.`,
          c.description,
          `As a result I have suffered a loss of ${amount}. I have attempted to resolve this matter directly and have not received a satisfactory response.`,
        ];

  const paragraphs = [
    ...body,
    `I request payment of ${amount} within twenty-one (21) days of the date of this letter. If I do not receive payment or a written response within that period, I intend to file a claim in the ${c.county.name} small claims court and will ask the court to award the amount owed together with court costs.`,
    version.source === "agent_edit"
      ? "This letter has been updated to reflect the corrections requested by the sender."
      : "Please treat this letter as formal notice of my claim.",
  ];

  const signedOn = c.letter.signedAt ? formatDate(c.letter.signedAt) : null;

  return {
    versionNumber: version.number,
    dateLine: formatLongDate(version.createdAt),
    sender: [fullName(profile), ...addressLines(profile.address)],
    recipient: [c.defendant.name, ...addressLines(c.defendant.address)],
    subject: `Demand for payment — ${claimLabel} (${c.referenceCode})`,
    paragraphs,
    closing: "Sincerely,",
    signedName: c.letter.signedName,
    signedOn,
  };
}

export function latestVersion(c: CaseRecord): LetterVersion | null {
  return c.letter.versions[c.letter.versions.length - 1] ?? null;
}

export function letterToPlainText(letter: LetterContent): string {
  return [
    letter.dateLine,
    "",
    ...letter.sender,
    "",
    ...letter.recipient,
    "",
    `Re: ${letter.subject}`,
    "",
    ...letter.paragraphs.flatMap((p) => [p, ""]),
    letter.closing,
    letter.signedName ? `${letter.signedName}  (signed ${letter.signedOn})` : "[signature pending]",
  ].join("\n");
}
