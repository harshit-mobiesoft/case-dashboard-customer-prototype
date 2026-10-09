"use client";

import { CaseGate } from "@/components/layout/case-gate";
import { QuestionnaireView } from "./questionnaire-view";

export function QuestionnairePage({ caseId, from }: { caseId: string; from?: "documents" }) {
  return (
    <CaseGate caseId={caseId} loadingLabel="Loading questionnaire">
      {({ case: c }) => <QuestionnaireView c={c} from={from} />}
    </CaseGate>
  );
}
