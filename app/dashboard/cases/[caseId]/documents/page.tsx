import type { Metadata } from "next";
import { DocumentsPage } from "@/components/documents/documents-page";

export const metadata: Metadata = { title: "Documents & evidence" };

export default function Page({ params }: { params: { caseId: string } }) {
  return <DocumentsPage caseId={params.caseId} />;
}
