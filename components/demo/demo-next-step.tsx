"use client";

import { ArrowRight, FastForward, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { repository } from "@/lib/data/repository";
import { isResponseWindowExpired } from "@/lib/domain/status";
import { describeTeamAction } from "@/lib/domain/transitions";
import type { CaseRecord } from "@/lib/domain/types";
import { useAsyncAction } from "@/lib/hooks/use-demo";

interface Shortcut {
  /** Why the customer is stuck, in plain words. */
  why: string;
  label: string;
  run: () => Promise<unknown>;
  secondary?: { label: string; run: () => Promise<unknown> };
}

function getShortcut(c: CaseRecord, now: Date): Shortcut | null {
  const team = describeTeamAction(c);
  if (team.advance) {
    return {
      why: "This step is handled by our team — in the real app it happens behind the scenes.",
      label: team.advance,
      run: () => repository.simulateTeamAction(c.id, "advance"),
      secondary: team.requestChanges
        ? { label: team.requestChanges, run: () => repository.simulateTeamAction(c.id, "request_changes") }
        : undefined,
    };
  }
  if (c.status === "mailed" && !isResponseWindowExpired(c, now)) {
    return {
      why: "The defendant has 21 days to respond — in the real app you'd wait.",
      label: "Skip ahead 21 days",
      run: () => repository.fastForwardResponseWindow(c.id),
    };
  }
  return null;
}

/**
 * Prototype-only shortcut shown right under the status bar when the case is waiting on something the
 * customer can't do (our team, or the calendar) — so a walkthrough never stalls.
 */
export function DemoNextStep({ c, now }: { c: CaseRecord; now: Date }) {
  const { toast } = useToast();
  const shortcut = getShortcut(c, now);
  const action = useAsyncAction(
    (run: () => Promise<unknown>) => run(),
    (message) => toast({ title: "Couldn't do that", description: message, variant: "error" }),
  );

  if (!shortcut) return null;

  return (
    <section aria-label="Prototype shortcut" className="bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
        <p className="flex items-start gap-2 text-sm">
          <FlaskConical className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" aria-hidden="true" />
          <span>
            <span className="font-semibold text-amber-200">Prototype shortcut · </span>
            {shortcut.why}
          </span>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {shortcut.secondary && (
            <button
              type="button"
              disabled={action.pending}
              onClick={() => void action.run(shortcut.secondary!.run)}
              className="text-sm text-gray-300 underline hover:text-white disabled:opacity-50"
            >
              {shortcut.secondary.label}
            </button>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-gray-900 hover:bg-gray-100"
            loading={action.pending}
            onClick={() => void action.run(shortcut.run)}
          >
            {shortcut.label === "Skip ahead 21 days" ? (
              <FastForward className="h-4 w-4" aria-hidden="true" />
            ) : null}
            {shortcut.label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

