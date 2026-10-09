"use client";

import { ChevronDown, FastForward, FlaskConical, RotateCcw, ShieldAlert, UserCog, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { errorMessage, repository } from "@/lib/data/repository";
import { ACTIVATION_HERO_SCENARIOS, SMALL_CLAIMS_SCENARIOS, type DemoScenario } from "@/lib/data/seed";
import { routes } from "@/lib/domain/routes";
import { isResponseWindowExpired } from "@/lib/domain/status";
import { describeTeamAction } from "@/lib/domain/transitions";
import { cn } from "@/lib/utils";
import { useDemoState, useNow } from "@/lib/hooks/use-demo";

/**
 * Presenter tools, kept deliberately small: jump to any stage of the journey, and — only when it
 * applies to the case you're on — play the part of our team or the calendar.
 */
export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const state = useDemoState();
  const now = useNow();
  const params = useParams<{ caseId?: string }>();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const activeCase = state && params.caseId ? state.cases.find((c) => c.id === params.caseId) : undefined;
  const teamAction = activeCase ? describeTeamAction(activeCase) : null;
  const canSkipAhead =
    !!activeCase && activeCase.status === "mailed" && !!now && !isResponseWindowExpired(activeCase, now);
  const hasSimulation = !!(teamAction?.advance || teamAction?.requestChanges || canSkipAhead);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      toast({ title: label });
    } catch (err) {
      toast({ title: "Couldn't do that", description: errorMessage(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  function StageList({ title, scenarios }: { title: string; scenarios: DemoScenario[] }) {
    const available = scenarios.filter((s) => state?.cases.some((c) => c.id === s.id));
    if (available.length === 0) return null;
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{title}</h3>
        <ol className="space-y-0.5">
          {available.map((s, i) => {
            const current = params.caseId === s.id;
            return (
              <li key={s.id}>
                <Link
                  href={routes.case(s.id)}
                  onClick={() => setOpen(false)}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex items-baseline gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50",
                    current ? "bg-brand-50 text-brand-800 font-medium" : "text-gray-800",
                  )}
                >
                  <span className="w-5 shrink-0 text-xs text-gray-500 tabular-nums">{i + 1}</span>
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 z-40 print:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="demo-panel"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-gray-800"
        >
          <FlaskConical className="h-4 w-4 text-amber-300" aria-hidden="true" />
          Demo controls
        </button>
      </div>

      {open && (
        <section
          id="demo-panel"
          aria-label="Demo controls"
          className="fixed bottom-16 left-4 z-40 w-[calc(100%-2rem)] max-w-sm max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl animate-slide-up"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
            <h2 className="font-semibold text-sm text-gray-900">Demo controls</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close demo controls"
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            <p className="text-sm text-gray-600">Jump to any stage of a customer&apos;s case.</p>

            <StageList title="Activation Hero" scenarios={ACTIVATION_HERO_SCENARIOS} />
            <StageList title="Small Claims" scenarios={SMALL_CLAIMS_SCENARIOS} />

            {hasSimulation && activeCase && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Simulate what happens next</h3>
                {teamAction?.advance && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto bg-white"
                    disabled={busy}
                    onClick={() => run("Done", () => repository.simulateTeamAction(activeCase.id, "advance"))}
                  >
                    <UserCog className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {teamAction.advance}
                  </Button>
                )}
                {teamAction?.requestChanges && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto bg-white"
                    disabled={busy}
                    onClick={() => run("Done", () => repository.simulateTeamAction(activeCase.id, "request_changes"))}
                  >
                    <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {teamAction.requestChanges}
                  </Button>
                )}
                {canSkipAhead && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto bg-white"
                    disabled={busy}
                    onClick={() => run("Done", () => repository.fastForwardResponseWindow(activeCase.id))}
                  >
                    <FastForward className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Skip ahead 21 days
                  </Button>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setConfirmReset(true)}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset demo data
              </Button>
              <details className="group text-sm">
                <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-gray-700">
                  <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" aria-hidden="true" />
                  More
                </summary>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mt-1"
                  onClick={() => {
                    repository.failNextRequest();
                    toast({ title: "The next action will fail", description: "Shows the error state once." });
                  }}
                >
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  Show an error on the next action
                </Button>
              </details>
            </div>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        description="Every case goes back to its starting step. Anything you did in this demo is discarded."
        confirmLabel="Reset"
        variant="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          await repository.resetDemo();
          toast({ title: "Demo data reset" });
        }}
      />
    </>
  );
}
