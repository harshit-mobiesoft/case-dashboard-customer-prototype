import { Badge } from "@/components/ui/badge";
import type { PhaseState } from "@/lib/domain/phases";
import { cn } from "@/lib/utils";

interface Props {
  number: 1 | 2 | 3;
  title: string;
  state: PhaseState;
  /** Extra neutral badge, e.g. "Included" / "Free Bonus". */
  tag?: string;
  /** Shown instead of children while locked/skipped. */
  inactiveMessage?: string;
  children?: React.ReactNode;
}

const STATE_BADGE: Record<PhaseState, { label: string; variant: "outline" | "info" | "success" | "default" }> = {
  locked: { label: "Locked", variant: "outline" },
  active: { label: "Active", variant: "info" },
  complete: { label: "Complete", variant: "success" },
  skipped: { label: "Not needed", variant: "default" },
};

export function PhaseCard({ number, title, state, tag, inactiveMessage, children }: Props) {
  const inactive = state === "locked" || state === "skipped";
  const badge = STATE_BADGE[state];
  const headingId = `phase-${number}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      data-phase={number}
      data-state={state}
      className={cn("bg-white border rounded-xl overflow-hidden", inactive ? "border-gray-200 bg-gray-50" : "border-gray-200")}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className={cn(
              "h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0",
              inactive ? "bg-gray-200 text-gray-600" : "bg-brand-600 text-white",
            )}
          >
            {number}
          </span>
          <h2 id={headingId} className={cn("font-semibold", inactive ? "text-gray-600" : "text-gray-900")}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tag && <Badge variant="default">{tag}</Badge>}
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </div>
      <div className="p-5">
        {inactive ? <p className="text-sm text-gray-600">{inactiveMessage}</p> : children}
      </div>
    </section>
  );
}
