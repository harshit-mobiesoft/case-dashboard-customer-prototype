import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { routes } from "@/lib/domain/routes";

export default function NotFound() {
  return (
    <main id="main" className="max-w-xl mx-auto px-4 py-16">
      <EmptyState as="h1" icon={FileQuestion} title="Page not found">
        <p className="mb-4">The page you&apos;re looking for doesn&apos;t exist in this prototype.</p>
        <Link href={routes.dashboard} className="text-brand-700 font-medium hover:underline">
          Back to my cases
        </Link>
      </EmptyState>
    </main>
  );
}
