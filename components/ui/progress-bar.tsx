import * as RadixProgress from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label,
  className,
  indicatorClassName,
}: {
  value: number;
  /** Accessible name, e.g. "Response window elapsed". */
  label: string;
  className?: string;
  indicatorClassName?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <RadixProgress.Root
      value={clamped}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-gray-100", className)}
    >
      <RadixProgress.Indicator
        className={cn("h-full rounded-full transition-all", indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </RadixProgress.Root>
  );
}
