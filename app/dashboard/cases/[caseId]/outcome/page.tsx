import type { Metadata } from "next";
import { OutcomePage } from "@/components/outcome/outcome-page";

export const metadata: Metadata = { title: "Mark the outcome" };

export default function Page({ params }: { params: { caseId: string } }) {
  return <OutcomePage caseId={params.caseId} />;
}
