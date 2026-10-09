import type { Metadata } from "next";
import { ReviewPage } from "@/components/review/review-page";

export const metadata: Metadata = { title: "Review & sign" };

export default function Page({ params }: { params: { caseId: string } }) {
  return <ReviewPage caseId={params.caseId} />;
}
