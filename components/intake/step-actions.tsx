import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  hasErrors: boolean;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
}

/** Back / Continue row plus the "some fields need attention" line, as in the production wizard. */
export function StepActions({ hasErrors, onBack, onNext, nextLabel = "Continue", busy, busyLabel = "Saving…", disabled }: Props) {
  return (
    <>
      {hasErrors && (
        <p role="alert" className="text-sm text-red-600 mt-4 mb-1">
          Some required fields need your attention.
        </p>
      )}
      <div className={cn("flex gap-3 items-center", hasErrors ? "mt-2" : "mt-8")}>
        {onBack ? (
          <Button variant="outline" onClick={onBack} disabled={busy} className="flex-1 sm:flex-none">
            Back
          </Button>
        ) : (
          <div className="flex-1 sm:flex-none" />
        )}
        <Button size="lg" onClick={onNext} disabled={busy || disabled} className="flex-1 sm:flex-none sm:ml-auto">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? busyLabel : nextLabel}
        </Button>
      </div>
    </>
  );
}
