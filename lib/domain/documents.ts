import { MAILING_METHOD_LABELS } from "./labels";
import { buildLetter, latestVersion, letterToPlainText } from "./letter";
import type { CaseRecord, Profile } from "./types";
import { formatCurrency, formatDate } from "../format";

export type DocumentKind =
  | "intake_summary"
  | "signed_letter"
  | "mailing_proof"
  | "certified_receipt"
  | "case_summary";

export interface CaseDocument {
  kind: DocumentKind;
  label: string;
  description: string;
  fileName: string;
}

/** Documents that exist for a case right now — derived, never stored. */
export function getDocuments(c: CaseRecord): CaseDocument[] {
  const docs: CaseDocument[] = [
    {
      kind: "intake_summary",
      label: "Intake summary",
      description: "A copy of the information and claim details you submitted.",
      fileName: `${c.referenceCode}-intake-summary.txt`,
    },
  ];
  if (c.letter.signedAt) {
    docs.push({
      kind: "signed_letter",
      label: "Signed demand letter",
      description: `Your signed demand letter, signed on ${formatDate(c.letter.signedAt)}.`,
      fileName: `${c.referenceCode}-signed-demand-letter.txt`,
    });
  }
  if (c.mailing) {
    docs.push({
      kind: "mailing_proof",
      label: MAILING_METHOD_LABELS[c.mailing.method],
      description: `Physical mailing submitted ${formatDate(c.mailing.sentAt)}.`,
      fileName: `${c.referenceCode}-mailing-proof.txt`,
    });
    if (c.mailing.method === "certified") {
      docs.push({
        kind: "certified_receipt",
        label: "Certificate of mailing",
        description: "Proof the letter was sent by certified mail, with tracking number.",
        fileName: `${c.referenceCode}-certificate-of-mailing.txt`,
      });
    }
  }
  if (c.status === "closed") {
    docs.push({
      kind: "case_summary",
      label: "Case summary",
      description: "A summary of everything that happened on your case.",
      fileName: `${c.referenceCode}-case-summary.txt`,
    });
  }
  return docs;
}

/**
 * Prototype downloads are plain-text stand-ins for the production PDFs, generated
 * client-side so the download interaction can be demoed without a backend.
 */
export function renderDocumentText(doc: CaseDocument, c: CaseRecord, profile: Profile): string {
  const header = [
    "CASE DASHBOARD — PROTOTYPE DOCUMENT (not a legal document)",
    `Case ${c.referenceCode} · vs. ${c.defendant.name}`,
    "",
  ];
  switch (doc.kind) {
    case "intake_summary":
      return [
        ...header,
        `Claimant: ${profile.firstName} ${profile.lastName} <${profile.email}>`,
        `Defendant: ${c.defendant.name}`,
        `Amount claimed: ${formatCurrency(c.amountCents / 100)}`,
        `Incident date: ${formatDate(c.incidentDate)}`,
        `Filing county: ${c.county.name}, ${c.county.state}`,
        "",
        c.description,
      ].join("\n");
    case "signed_letter": {
      const version = latestVersion(c);
      return version
        ? [...header, letterToPlainText(buildLetter(c, profile, version))].join("\n")
        : header.join("\n");
    }
    case "mailing_proof":
    case "certified_receipt":
      return [
        ...header,
        `Method: ${c.mailing ? MAILING_METHOD_LABELS[c.mailing.method] : "—"}`,
        `Sent: ${c.mailing ? formatDate(c.mailing.sentAt) : "—"}`,
        `Tracking: ${c.mailing?.trackingNumber ?? "n/a (first class)"}`,
      ].join("\n");
    case "case_summary":
      return [
        ...header,
        `Outcome: ${c.outcome?.type ?? "closed after court filing"}`,
        "",
        "Activity:",
        ...c.activity.map((a) => `- ${formatDate(a.at)}  ${a.type}`),
      ].join("\n");
  }
}
