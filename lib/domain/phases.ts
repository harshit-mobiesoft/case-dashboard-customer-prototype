import type { CaseRecord } from "./types";

export type PhaseState = "locked" | "active" | "complete" | "skipped";

export interface PhaseStates {
  /** Phase 1 — demand letter. */
  letter: PhaseState;
  /** Phase 2 — response window & outcome. */
  response: PhaseState;
  /** Phase 3 — court filing. */
  court: PhaseState;
}

export function getPhaseStates(c: CaseRecord): PhaseStates {
  const letter: PhaseState = c.mailing ? "complete" : "active";

  const response: PhaseState = !c.mailing ? "locked" : c.outcome ? "complete" : "active";

  let court: PhaseState;
  if (c.status === "phase2_unlocked" || c.status === "phase2_in_progress") court = "active";
  else if (c.status === "phase2_completed") court = "complete";
  else if (c.status === "closed") court = c.outcome?.type === "settled" ? "skipped" : "complete";
  else court = "locked";

  return { letter, response, court };
}
