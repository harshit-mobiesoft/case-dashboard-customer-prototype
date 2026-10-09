"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/domain/routes";
import type { CaseRecord, Profile } from "@/lib/domain/types";
import { useCase, useNow } from "@/lib/hooks/use-demo";

export function PageSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <LoadingRegion label={label}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </LoadingRegion>
  );
}

export function CaseNotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <EmptyState as="h1" icon={FileQuestion} title="We couldn't find that case">
        <p className="mb-4">It may have been removed when the demo data was reset.</p>
        <Link href={routes.dashboard} className="text-brand-700 font-medium hover:underline">
          Back to my cases
        </Link>
      </EmptyState>
    </div>
  );
}

/**
 * Resolves a case (and the current time) before rendering a screen, so every screen shares
 * the same loading + not-found behaviour and can assume a non-null case and clock.
 */
export function CaseGate({
  caseId,
  children,
  loadingLabel = "Loading case",
}: {
  caseId: string;
  loadingLabel?: string;
  children: (ctx: { case: CaseRecord; profile: Profile; now: Date }) => React.ReactNode;
}) {
  const lookup = useCase(caseId);
  const now = useNow();

  if (lookup.status === "loading" || !now) return <PageSkeleton label={loadingLabel} />;
  if (lookup.status === "not_found") return <CaseNotFound />;
  return <>{children({ case: lookup.case, profile: lookup.profile, now })}</>;
}
