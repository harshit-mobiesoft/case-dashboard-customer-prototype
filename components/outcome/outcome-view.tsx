"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { repository } from "@/lib/data/repository";
import { RESOLUTION_LABELS } from "@/lib/domain/labels";
import { parseUsdToCents } from "@/lib/domain/money";
import { routes } from "@/lib/domain/routes";
import { isResponseWindowExpired } from "@/lib/domain/status";
import { daysRemaining } from "@/lib/domain/time";
import {
  UNSATISFACTORY_ISSUES,
  type CaseRecord,
  type SettlementResolution,
} from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { useAsyncAction, useStrict } from "@/lib/hooks/use-demo";
import { cn } from "@/lib/utils";

type Choice = "settled" | "unsatisfactory" | "no_response" | null;
const RESOLUTIONS = Object.keys(RESOLUTION_LABELS) as SettlementResolution[];

export function OutcomeView({ c, now }: { c: CaseRecord; now: Date }) {
  const router = useRouter();
  const { toast } = useToast();
  const [choice, setChoice] = useState<Choice>(null);
  const strict = useStrict();
  const [resolution, setResolution] = useState<SettlementResolution | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const [closedNow, setClosedNow] = useState(false);
  // True from the moment we submit until we know the result, so the "already recorded" guard
  // below doesn't flash while the store updates underneath us.
  const [leaving, setLeaving] = useState(false);

  const settle = useAsyncAction(
    (r: SettlementResolution) => repository.markSettled(c.id, r),
    (m) => toast({ title: "Couldn't close the case", description: m, variant: "error" }),
  );
  const proceed = useAsyncAction(
    (input: { type: "no_response" | "unsatisfactory"; issues?: string[]; amountReceivedCents?: number | null }) =>
      repository.proceedToCourt(c.id, input),
    (m) => toast({ title: "Couldn't proceed", description: m, variant: "error" }),
  );
  const busy = settle.pending || proceed.pending;
  const error = settle.error ?? proceed.error;

  const deadline = c.mailing?.responseWindowEndsAt ?? null;
  const windowOpen = deadline !== null && !isResponseWindowExpired(c, now);
  const left = deadline ? daysRemaining(deadline, now) : 0;

  const back = (
    <Link href={routes.case(c.id)} className="text-sm text-gray-600 hover:underline">
      ← Back to case
    </Link>
  );

  if (closedNow) {
    return (
      <main id="main" className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-700" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Case closed</h1>
        <p className="text-gray-600 mb-6">
          Congratulations on your resolution. Your documents will remain available to download for 12 months.
        </p>
        <Link href={routes.dashboard} className={buttonVariants({ variant: "outline" })}>
          Back to my cases
        </Link>
      </main>
    );
  }

  if (c.status !== "mailed" && leaving) {
    return (
      <main id="main" className="max-w-xl mx-auto px-4 py-16 text-center text-gray-600" role="status">
        Updating your case…
      </main>
    );
  }

  if (c.status !== "mailed") {
    const recorded = c.outcome !== null;
    return (
      <main id="main" className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        {back}
        <div className="mt-6">
          <EmptyState as="h1" icon={Clock} title={recorded ? "The outcome is already recorded" : "Not available yet"}>
            <p className="mb-4">
              {recorded
                ? "You've already told us how this case turned out."
                : "You can mark the outcome once your letter has been mailed to the defendant."}
            </p>
            <Link href={routes.case(c.id)} className="text-brand-700 font-medium hover:underline">
              Back to your case
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  async function handleSettle() {
    if (strict && !resolution) return;
    setLeaving(true);
    const r = await settle.run(resolution ?? "full_payment_received");
    if (r) setClosedNow(true);
    else setLeaving(false);
  }

  async function handleProceed(type: "no_response" | "unsatisfactory", force = false) {
    // Validate first so a typo is reported before we ask "are you sure?".
    let amountReceivedCents: number | null = null;
    if (type === "unsatisfactory") {
      const parsed = parseUsdToCents(amount);
      if (parsed === "invalid") {
        if (strict) return setAmountError("Enter an amount like 250 or 250.00.");
      } else {
        amountReceivedCents = parsed;
      }
    }
    setAmountError(null);

    // The "are you sure?" step is part of strict mode only; the prototype just moves on.
    if (strict && windowOpen && !force) return setWarnOpen(true);

    setLeaving(true);
    const r = await proceed.run({ type, issues: type === "unsatisfactory" ? issues : [], amountReceivedCents });
    if (r) {
      toast({ title: "Court filing unlocked", description: "Your first step is ready on your case page." });
      router.push(routes.case(c.id));
    } else {
      setLeaving(false);
    }
  }

  return (
    <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        {back}
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Mark the outcome</h1>
        <p className="text-gray-600 text-sm mt-0.5">What happened after you sent the demand letter?</p>
      </div>

      {deadline && (
        <div
          className={cn(
            "rounded-xl p-4 mb-6 flex items-center gap-3 border",
            windowOpen ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200",
          )}
        >
          <Clock className={cn("h-5 w-5 shrink-0", windowOpen ? "text-amber-700" : "text-gray-600")} aria-hidden="true" />
          {windowOpen ? (
            <div>
              <p className="text-sm font-semibold text-amber-950">
                {left} {left === 1 ? "day" : "days"} remaining in the response window
              </p>
              <p className="text-xs text-amber-900">
                Window closes {formatDate(deadline)}. You can mark the outcome early if needed.
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-800">Response window closed on {formatDate(deadline)}</p>
          )}
        </div>
      )}

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-3 mb-6">
        <ChoiceCard
          open={choice === "settled"}
          onToggle={() => setChoice(choice === "settled" ? null : "settled")}
          disabled={busy}
          icon={CheckCircle2}
          accent="green"
          title="We already settled"
          subtitle="The defendant paid or we reached an agreement"
        >
          <fieldset>
            <legend className="text-sm font-medium text-gray-800 mb-3">How was it resolved?</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {RESOLUTIONS.map((r) => (
                <label
                  key={r}
                  className={cn(
                    "cursor-pointer text-center py-2 px-3 rounded-lg border text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                    resolution === r
                      ? "border-green-600 bg-green-50 text-green-900"
                      : "border-gray-300 text-gray-800 hover:border-gray-400",
                  )}
                >
                  <input
                    type="radio"
                    name="resolution"
                    value={r}
                    checked={resolution === r}
                    onChange={() => setResolution(r)}
                    disabled={busy}
                    className="sr-only"
                  />
                  {RESOLUTION_LABELS[r]}
                </label>
              ))}
            </div>
          </fieldset>
          <Button
            variant="success"
            className="w-full"
            onClick={() => void handleSettle()}
            disabled={strict && !resolution}
            loading={settle.pending}
          >
            {settle.pending ? "Closing case…" : "Close my case"}
          </Button>
          {strict && !resolution && <p className="text-xs text-gray-600 text-center mt-2">Select how it was resolved to continue</p>}
        </ChoiceCard>

        <ChoiceCard
          open={choice === "unsatisfactory"}
          onToggle={() => setChoice(choice === "unsatisfactory" ? null : "unsatisfactory")}
          disabled={busy}
          icon={AlertTriangle}
          accent="amber"
          title="They responded, but unsatisfactorily"
          subtitle="They replied but didn't offer full payment"
        >
          <fieldset className="mb-4">
            <legend className="text-sm font-medium text-gray-800 mb-2">What was the issue?</legend>
            {UNSATISFACTORY_ISSUES.map((opt) => (
              <label key={opt} className="flex items-center gap-2 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={issues.includes(opt)}
                  onChange={(e) => setIssues((prev) => (e.target.checked ? [...prev, opt] : prev.filter((o) => o !== opt)))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                <span className="text-sm text-gray-800">{opt}</span>
              </label>
            ))}
          </fieldset>
          <div className="mb-4">
            <label htmlFor="amount-received" className="block text-sm font-medium text-gray-800 mb-1.5">
              Amount received (if any)
            </label>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500 shrink-0" aria-hidden="true" />
              <input
                id="amount-received"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountError(null);
                }}
                placeholder="0.00"
                aria-invalid={!!amountError || undefined}
                aria-describedby={amountError ? "amount-error" : undefined}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {amountError && (
              <p id="amount-error" role="alert" className="text-xs text-red-700 mt-1">
                {amountError}
              </p>
            )}
          </div>
          <Button
            className="w-full"
            onClick={() => void handleProceed("unsatisfactory")}
            disabled={strict && issues.length === 0}
            loading={proceed.pending}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            {proceed.pending ? "Proceeding…" : "Proceed to court filing"}
          </Button>
          {strict && issues.length === 0 && (
            <p className="text-xs text-gray-600 text-center mt-2">Select at least one issue to continue</p>
          )}
        </ChoiceCard>

        <ChoiceCard
          open={choice === "no_response"}
          onToggle={() => setChoice(choice === "no_response" ? null : "no_response")}
          disabled={busy}
          icon={Clock}
          accent="brand"
          title="No response"
          subtitle="The defendant didn't respond at all"
        >
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-brand-900">
              <strong>Good position.</strong> No response is a strong signal that the defendant may not contest your
              claim. Courts often view this favorably.
            </p>
          </div>
          <Button className="w-full" onClick={() => void handleProceed("no_response")} loading={proceed.pending}>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            {proceed.pending ? "Proceeding…" : "Proceed to court filing"}
          </Button>
        </ChoiceCard>
      </div>

      <Dialog
        open={warnOpen}
        onOpenChange={setWarnOpen}
        title="Proceed before the window closes?"
        description={`You still have ${left} ${left === 1 ? "day" : "days"} remaining. Proceeding now means you're filing before the full response window — the defendant could still respond. We recommend waiting unless you're certain.`}
      >
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setWarnOpen(false)}>
            Wait
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setWarnOpen(false);
              void handleProceed(choice === "unsatisfactory" ? "unsatisfactory" : "no_response", true);
            }}
          >
            Proceed anyway
          </Button>
        </div>
      </Dialog>
    </main>
  );
}

const ACCENTS = {
  green: { border: "border-green-500", icon: "text-green-700" },
  amber: { border: "border-amber-500", icon: "text-amber-700" },
  brand: { border: "border-brand-500", icon: "text-brand-700" },
} as const;

function ChoiceCard({
  open,
  onToggle,
  disabled,
  icon: Icon,
  accent,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  disabled: boolean;
  icon: typeof CheckCircle2;
  accent: keyof typeof ACCENTS;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const panelId = useId();
  return (
    <div className={cn("border-2 rounded-xl overflow-hidden bg-white transition-colors", open ? ACCENTS[accent].border : "border-gray-200")}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50"
      >
        <Icon className={cn("h-5 w-5 shrink-0", open ? ACCENTS[accent].icon : "text-gray-400")} aria-hidden="true" />
        <span className="flex-1">
          <span className="block font-semibold text-gray-900">{title}</span>
          <span className="block text-sm text-gray-600">{subtitle}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} role="region" aria-label={title} className="px-5 pb-5 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
