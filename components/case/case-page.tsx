"use client";

import { CaseGate } from "@/components/layout/case-gate";
import { CaseView } from "./case-view";

export function CasePage({ caseId }: { caseId: string }) {
  return <CaseGate caseId={caseId}>{({ case: c, now }) => <CaseView c={c} now={now} />}</CaseGate>;
}
