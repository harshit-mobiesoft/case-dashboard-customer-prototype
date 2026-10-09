import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { routes } from "@/lib/domain/routes";
import { isResponseWindowExpired } from "@/lib/domain/status";
import { URGENT_DAYS, daysRemaining, windowElapsedPercent } from "@/lib/domain/time";
import type { CaseRecord } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The countdown card. Only meaningful while the case is mailed and no outcome is marked. */
export function ResponseWindowCard({ c, now }: { c: CaseRecord; now: Date }) {
  if (c.status !== "mailed" || !c.mailing) return null;

  const { sentAt, responseWindowEndsAt } = c.mailing;
  const expired = isResponseWindowExpired(c, now);
  const left = daysRemaining(responseWindowEndsAt, now);
  const urgent = !expired && left <= URGENT_DAYS;
  const pct = windowElapsedPercent(sentAt, responseWindowEndsAt, now);
  const total = Math.round(
    (new Date(responseWindowEndsAt).getTime() - new Date(sentAt).getTime()) / 86_400_000,
  );

  const tone = expired
    ? { head: "bg-red-50 border-red-100 text-red-800", pill: "bg-red-100 text-red-800" }
    : urgent
      ? { head: "bg-amber-50 border-amber-100 text-amber-900", pill: "bg-amber-100 text-amber-900" }
      : { head: "bg-brand-50 border-brand-100 text-brand-800", pill: "bg-brand-100 text-brand-800" };

  return (
    <section
      aria-label="Response window"
      data-urgent={urgent || undefined}
      data-expired={expired || undefined}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      <div className={cn("px-5 py-3 flex items-center justify-between border-b", tone.head)}>
        <h2 className="text-xs font-semibold uppercase tracking-wide">
          {expired ? "Window closed" : `${total}-day response window`}
        </h2>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", tone.pill)}>
          {Math.round(pct)}% elapsed
        </span>
      </div>

      <div className="px-5 pt-4 pb-5 space-y-4">
        {expired ? (
          <>
            <p className="text-sm text-gray-700">
              The {total}-day response window has closed. Please mark the outcome to proceed.
            </p>
            <Link href={routes.outcome(c.id)} className={cn(buttonVariants(), "w-full")}>
              Mark outcome →
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <span className={cn("text-4xl font-bold", urgent ? "text-amber-700" : "text-gray-900")}>{left}</span>
                <span className="text-sm text-gray-600 ml-1.5">
                  / {total} {left === 1 ? "day" : "days"} left
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Deadline</p>
                <p className="text-xs font-semibold text-gray-800">{formatDate(responseWindowEndsAt)}</p>
              </div>
            </div>

            <div>
              <ProgressBar
                value={pct}
                label="Response window elapsed"
                indicatorClassName={urgent ? "bg-gradient-to-r from-amber-400 to-red-500" : "bg-gradient-to-r from-brand-400 to-brand-600"}
              />
              <div className="flex justify-between mt-1 text-xs text-gray-600">
                <span>Mailed</span>
                <span>Day {total}</span>
              </div>
            </div>

            {urgent && (
              <Link
                href={routes.outcome(c.id)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full border-amber-400 text-amber-900 hover:bg-amber-50")}
              >
                Mark outcome early
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}

