import type { CaseRecord } from "./types";

/**
 * "No evidence" customers can skip Dropbox; anyone with evidence needs it connected,
 * because evidence files are stored there.
 */
export function isOrganized(
  c: Pick<CaseRecord, "evidence" | "dropbox" | "hasEvidenceToUpload">,
): boolean {
  if (c.evidence.length > 0) return c.dropbox.connected;
  return c.hasEvidenceToUpload === false;
}

/** Customer said they have evidence to upload but hasn't attached a single file yet. */
export function needsEvidenceUpload(
  c: Pick<CaseRecord, "evidence" | "hasEvidenceToUpload">,
): boolean {
  return c.hasEvidenceToUpload === true && !c.evidence.some((item) => item.files.length > 0);
}
