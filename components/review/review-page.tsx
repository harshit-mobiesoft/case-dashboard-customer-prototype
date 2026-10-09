"use client";

import { CaseGate } from "@/components/layout/case-gate";
import { ReviewView } from "./review-view";

export function ReviewPage({ caseId }: { caseId: string }) {
  return (
    <CaseGate caseId={caseId} loadingLabel="Loading your letter">
      {({ case: c, profile, now }) => <ReviewView c={c} profile={profile} now={now} />}
    </CaseGate>
  );
}
