"use client";

import { CaseGate } from "@/components/layout/case-gate";
import { OutcomeView } from "./outcome-view";

export function OutcomePage({ caseId }: { caseId: string }) {
  return (
    <CaseGate caseId={caseId} loadingLabel="Loading">
      {({ case: c, now }) => <OutcomeView c={c} now={now} />}
    </CaseGate>
  );
}
