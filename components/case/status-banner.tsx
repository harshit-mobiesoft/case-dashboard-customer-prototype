import { ArrowRight, ClipboardCheck, Clock, Cloud, Hourglass } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BUCKET_STYLES, type Bucket, type StatusBarInfo } from "@/lib/domain/status";
import { cn } from "@/lib/utils";

const ICON_BY_BUCKET = {
  waiting_on_client: ClipboardCheck,
  waiting_on_us: Clock,
  waiting_period: Hourglass,
  done: ClipboardCheck,
} as const satisfies Record<Bucket, unknown>;

interface Props {
  caseId: string;
  info: StatusBarInfo;
  /** Light strip for recommended side tasks (e.g. connect Dropbox) shown beneath the main bar. */
  secondary?: boolean;
}

export function StatusBanner({ caseId, info, secondary }: Props) {
  const href = info.cta ? `/dashboard/cases/${caseId}${info.cta.hrefSuffix}` : null;

  if (secondary) {
    return (
      <section aria-label="Recommended next step" className="bg-brand-50 border-b border-brand-100 text-brand-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Cloud className="h-4 w-4 text-brand-600 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sm">{info.title}</p>
              {info.description && <p className="text-brand-800/80 text-xs mt-0.5">{info.description}</p>}
            </div>
          </div>
          {info.cta && href && (
            <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}>
              {info.cta.label} <ArrowRight className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    );
  }

  const Icon = ICON_BY_BUCKET[info.bucket];
  const styles = BUCKET_STYLES[info.bucket];

  return (
    <section aria-label="Case status" data-bucket={info.bucket} className={cn(styles.bar, "text-white")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sm">{info.title}</p>
            {info.description && <p className="text-white/80 text-xs mt-0.5">{info.description}</p>}
          </div>
        </div>
        {info.cta && href && (
          <Link
            href={href}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "bg-white hover:bg-white/90 shrink-0", styles.ctaText)}
          >
            {info.cta.label} <ArrowRight className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}
