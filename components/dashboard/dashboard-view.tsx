"use client";

import { ArrowRight, Clock, FileText, Info, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PageSkeleton } from "@/components/layout/case-gate";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { errorMessage, repository } from "@/lib/data/repository";
import {
  DEFAULT_FILTERS,
  filtersActive,
  groupDashboard,
  type DashboardFilters,
  type ServiceFilter,
  type ViewFilter,
} from "@/lib/domain/dashboard";
import { SUPPORT_URL } from "@/lib/config";
import { INTAKE_SERVICE_PATHS } from "@/lib/domain/intake";
import { SERVICE_LABELS } from "@/lib/domain/labels";
import type { DraftApplication } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { useDemoState, useNow } from "@/lib/hooks/use-demo";
import { CaseCard } from "./case-card";

const SERVICE_OPTIONS: { value: ServiceFilter; label: string }[] = [
  { value: "all", label: "All services" },
  { value: "small_claims", label: SERVICE_LABELS.small_claims },
  { value: "activation_hero", label: SERVICE_LABELS.activation_hero },
];

const VIEW_OPTIONS: { value: ViewFilter; label: string }[] = [
  { value: "all", label: "All cases" },
  { value: "open", label: "Open cases" },
  { value: "draft", label: "Draft cases" },
  { value: "closed", label: "Closed cases" },
];

export function DashboardView() {
  const state = useDemoState();
  const now = useNow();
  const { toast } = useToast();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [cancelTarget, setCancelTarget] = useState<DraftApplication | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const groups = useMemo(
    () => (state && now ? groupDashboard(state.cases, state.drafts, filters, now) : null),
    [state, now, filters],
  );

  if (!state || !now || !groups) return <PageSkeleton label="Loading your cases" />;

  const hasAnything = state.cases.length > 0 || state.drafts.length > 0;
  const nothingMatches = groups.open.length + groups.drafts.length + groups.closed.length === 0;

  async function handleCancelDraft() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await repository.cancelDraft(cancelTarget.id);
      toast({ title: "Draft cancelled" });
    } catch (err) {
      toast({ title: "Couldn't cancel the draft", description: errorMessage(err), variant: "error" });
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this application?"
        description="This draft will be permanently removed and cannot be resumed."
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep it"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancelDraft}
        onCancel={() => setCancelTarget(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My cases</h1>
          <p className="text-gray-600 text-sm">Track the status of all your small claims disputes.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {(Object.keys(SERVICE_LABELS) as (keyof typeof SERVICE_LABELS)[]).map((service) => (
            <Link
              key={service}
              href={`${INTAKE_SERVICE_PATHS[service]}?new=1`}
              className="inline-flex items-center gap-1.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {service === "small_claims" ? "Small Claims" : "Activation Hero"}
            </Link>
          ))}
        </div>
      </div>

      {state.autoLinkedCount > 0 && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-blue-900">
            We found <strong>{state.autoLinkedCount} case{state.autoLinkedCount > 1 ? "s" : ""}</strong> linked to
            your email and added {state.autoLinkedCount > 1 ? "them" : "it"} to your account.
          </p>
        </div>
      )}

      {hasAnything && (
        <form
          role="search"
          aria-label="Filter cases"
          onSubmit={(e) => e.preventDefault()}
          className="flex items-end gap-3 flex-wrap mb-6"
        >
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <label htmlFor="case-search" className="sr-only">
              Search cases
            </label>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" aria-hidden="true" />
            <input
              id="case-search"
              type="search"
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              placeholder="Search by defendant or claim type…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white placeholder:text-gray-500"
            />
          </div>
          <div className="w-full sm:w-48">
            <SelectField
              label="Service"
              value={filters.service}
              onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value as ServiceFilter }))}
              options={SERVICE_OPTIONS}
              fieldClassName="[&>label]:sr-only"
            />
          </div>
          <div className="w-full sm:w-48">
            <SelectField
              label="Show"
              value={filters.view}
              onChange={(e) => setFilters((f) => ({ ...f, view: e.target.value as ViewFilter }))}
              options={VIEW_OPTIONS}
              fieldClassName="[&>label]:sr-only"
            />
          </div>
          {filtersActive(filters) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Clear filters
            </Button>
          )}
        </form>
      )}

      {!hasAnything && (
        <EmptyState icon={FileText} title="No cases yet">
          <p className="mb-5">Start your first small claims filing to get started.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={INTAKE_SERVICE_PATHS.small_claims} className={buttonVariants()}>
              + Small Claims
            </Link>
            <Link href={INTAKE_SERVICE_PATHS.activation_hero} className={buttonVariants()}>
              + Activation Hero
            </Link>
          </div>
        </EmptyState>
      )}

      {hasAnything && nothingMatches && (
        <EmptyState icon={FileText} title="No cases match your filters">
          Try a different search term or filter.
        </EmptyState>
      )}

      {groups.open.length > 0 && (
        <section aria-labelledby="open-heading" className="mb-8">
          <h2 id="open-heading" className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
            Open cases <span className="text-gray-500 font-normal normal-case">· {groups.open.length}</span>
          </h2>
          <ul className="space-y-3">
            {groups.open.map((c) => (
              <li key={c.id}>
                <CaseCard c={c} now={now} emphasized />
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.drafts.length > 0 && (
        <section aria-labelledby="draft-heading" className="mb-8">
          <h2 id="draft-heading" className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Draft cases <span className="text-gray-500 font-normal normal-case">· {groups.drafts.length}</span>
          </h2>
          <ul className="space-y-2">
            {groups.drafts.map((draft) => (
              <li
                key={draft.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-3.5"
              >
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">Draft</Badge>
                      {SERVICE_LABELS[draft.service]} application
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Last updated {formatDate(draft.updatedAt)} · Next: {draft.nextStepLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <Link
                    href={`${INTAKE_SERVICE_PATHS[draft.service]}?resume=${encodeURIComponent(draft.id)}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Resume
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Cancel ${SERVICE_LABELS[draft.service]} draft`}
                    onClick={() => setCancelTarget(draft)}
                    className="text-gray-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.closed.length > 0 && (
        <section aria-labelledby="closed-heading" className="mb-8">
          <h2 id="closed-heading" className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Closed cases <span className="text-gray-500 font-normal normal-case">· {groups.closed.length}</span>
          </h2>
          <ul className="space-y-3">
            {groups.closed.map((c) => (
              <li key={c.id}>
                <CaseCard c={c} now={now} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-gray-500 mt-6">
        Need help?{" "}
        <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
          Contact support
        </a>
      </p>
    </main>
  );
}
