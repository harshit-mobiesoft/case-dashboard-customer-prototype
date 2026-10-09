import type { Metadata } from "next";
import { QuestionnairePage } from "@/components/questionnaire/questionnaire-page";

export const metadata: Metadata = { title: "Questionnaire" };

export default function Page({
  params,
  searchParams,
}: {
  params: { caseId: string };
  searchParams: { from?: string };
}) {
  return <QuestionnairePage caseId={params.caseId} from={searchParams.from === "documents" ? "documents" : undefined} />;
}
