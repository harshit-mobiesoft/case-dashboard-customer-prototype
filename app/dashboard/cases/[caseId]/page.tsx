import type { Metadata } from "next";
import { CasePage } from "@/components/case/case-page";

export const metadata: Metadata = { title: "Case" };

export default function Page({ params }: { params: { caseId: string } }) {
  return <CasePage caseId={params.caseId} />;
}
