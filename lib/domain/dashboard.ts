// Pure list logic for the "My cases" screen (filtering, grouping, ordering, summary counts).

import { CLAIM_TYPE_LABELS, SERVICE_LABELS } from "./labels";
import { getBucket, type Bucket } from "./status";
import type { CaseRecord, DraftApplication, Service } from "./types";

export type ServiceFilter = "all" | Service;
export type ViewFilter = "all" | "open" | "draft" | "closed";

export interface DashboardFilters {
  query: string;
  service: ServiceFilter;
  view: ViewFilter;
}

export const DEFAULT_FILTERS: DashboardFilters = { query: "", service: "all", view: "all" };

export interface DashboardGroups {
  open: CaseRecord[];
  drafts: DraftApplication[];
  closed: CaseRecord[];
}

function caseSearchText(c: CaseRecord): string {
  return [
    c.defendant.name,
    c.claimType ? CLAIM_TYPE_LABELS[c.claimType] : "",
    c.referenceCode,
    SERVICE_LABELS[c.service],
  ]
    .join(" ")
    .toLowerCase();
}

function draftSearchText(d: DraftApplication): string {
  return `${SERVICE_LABELS[d.service]} application draft`.toLowerCase();
}

const BUCKET_ORDER: Record<Bucket, number> = {
  waiting_on_client: 0,
  waiting_on_us: 1,
  waiting_period: 2,
  done: 3,
};

/** Your turn first (that's what the customer came to do), then most recently active. */
export function sortOpenCases(cases: CaseRecord[], now: Date): CaseRecord[] {
  return [...cases].sort((a, b) => {
    const byBucket = BUCKET_ORDER[getBucket(a, now)] - BUCKET_ORDER[getBucket(b, now)];
    if (byBucket !== 0) return byBucket;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function groupDashboard(
  cases: CaseRecord[],
  drafts: DraftApplication[],
  filters: DashboardFilters,
  now: Date,
): DashboardGroups {
  const q = filters.query.trim().toLowerCase();
  const serviceOk = (s: Service) => filters.service === "all" || s === filters.service;

  const matching = cases.filter(
    (c) => !c.hiddenFromDashboard && serviceOk(c.service) && (!q || caseSearchText(c).includes(q)),
  );
  const matchingDrafts = drafts.filter((d) => serviceOk(d.service) && (!q || draftSearchText(d).includes(q)));

  const showOpen = filters.view === "all" || filters.view === "open";
  const showDraft = filters.view === "all" || filters.view === "draft";
  const showClosed = filters.view === "all" || filters.view === "closed";

  return {
    open: showOpen ? sortOpenCases(matching.filter((c) => c.status !== "closed"), now) : [],
    drafts: showDraft
      ? [...matchingDrafts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      : [],
    closed: showClosed
      ? matching
          .filter((c) => c.status === "closed")
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      : [],
  };
}

export function filtersActive(f: DashboardFilters): boolean {
  return f.query.trim() !== "" || f.service !== "all" || f.view !== "all";
}

export function summarize(cases: CaseRecord[], now: Date): Record<Bucket, number> {
  const counts: Record<Bucket, number> = { waiting_on_client: 0, waiting_on_us: 0, waiting_period: 0, done: 0 };
  for (const c of cases) counts[getBucket(c, now)] += 1;
  return counts;
}
