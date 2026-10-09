import { ChevronRight, FileText, ShieldCheck } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CLAIM_TYPE_LABELS, CLAIM_TYPE_PENDING_LABEL } from "@/lib/domain/labels";
import { routes } from "@/lib/domain/routes";
import { getStatusBadge, getStatusLabel } from "@/lib/domain/status";
import type { CaseRecord } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";

export function CaseCard({ c, now, emphasized }: { c: CaseRecord; now: Date; emphasized?: boolean }) {
  const claimLabel = c.claimType ? CLAIM_TYPE_LABELS[c.claimType] : CLAIM_TYPE_PENDING_LABEL;

  return (
    <Link
      href={routes.case(c.id)}
      aria-label={`Open case against ${c.defendant.name}`}
      className={
        emphasized
          ? "block bg-white border-2 border-brand-200 rounded-xl p-5 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer"
          : "block bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer"
      }
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
            <span className="truncate">vs. {c.defendant.name}</span>
            {c.service === "activation_hero" && (
              <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0" aria-label="Activation Hero case" role="img" />
            )}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {claimLabel} · {c.defendant.address.city}, {c.defendant.address.state}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={getStatusBadge(c, now)}>{getStatusLabel(c, now)}</Badge>
          {!emphasized && <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-y-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <span
            title="Case reference"
            className="inline-flex items-center shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-gray-600"
          >
            Case #{c.referenceCode}
          </span>
          <span className="font-semibold text-gray-900">{formatCurrency(c.amountCents / 100)}</span>
          <span>Filed {formatDate(c.createdAt)}</span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {c.mailing ? "Phase 2" : "Phase 1"}
          </span>
        </div>
        {emphasized && (
          <span className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm">
            View case
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </Link>
  );
}
