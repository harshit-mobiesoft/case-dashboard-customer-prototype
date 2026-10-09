"use client";

import { CaseGate } from "@/components/layout/case-gate";
import { DocumentsView } from "./documents-view";

export function DocumentsPage({ caseId }: { caseId: string }) {
  return (
    <CaseGate caseId={caseId} loadingLabel="Loading documents">
      {({ case: c, profile, now }) => <DocumentsView c={c} profile={profile} now={now} />}
    </CaseGate>
  );
}
