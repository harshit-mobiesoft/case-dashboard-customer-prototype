import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-gray-200/70", className)} />;
}

/** Announces loading to assistive tech once, while the visual skeleton shows. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
