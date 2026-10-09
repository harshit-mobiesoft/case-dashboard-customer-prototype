"use client";

import { AlertCircle, Check, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { repository } from "@/lib/data/repository";
import { useSession } from "@/lib/data/session";
import {
  demoIntakeForm,
  emptyIntakeForm,
  fromNavIndex,
  stepForKey,
  toNavStep,
  visibleSteps,
  type IntakeFormData,
} from "@/lib/domain/intake";
import type { Service } from "@/lib/domain/types";
import { useDemoState } from "@/lib/hooks/use-demo";
import { cn } from "@/lib/utils";
import { StepClaim } from "./step-claim";
import { StepClaimant } from "./step-claimant";
import { StepDefendant } from "./step-defendant";
import { StepFilingCourt } from "./step-filing-court";
import { StepPayment } from "./step-payment";
import { StepReview } from "./step-review";
import { StepUpgradeMail } from "./step-upgrade-mail";

export function IntakeFlow({ service }: { service: Service }) {
  const demo = useDemoState();
  const session = useSession();
  const [form, setForm] = useState<IntakeFormData | null>(null);
  const [strict, setStrict] = useState(false);
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ahAutoCounty, setAhAutoCounty] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const retryRef = useRef<(() => Promise<void>) | null>(null);
  // Where "Continue anyway" goes if a save fails.
  const skipToRef = useRef(1);
  const initialised = useRef(false);

  // Initialise once demo state + session are known: resume a draft, or start fresh (prefilled when signed in).
  useEffect(() => {
    if (initialised.current || !demo || session === "unknown") return;
    initialised.current = true;
    const params = new URLSearchParams(window.location.search);
    const strictMode = params.get("validate") === "1" || process.env.NEXT_PUBLIC_INTAKE_VALIDATION === "1";
    setStrict(strictMode);
    const resumeId = params.get("resume");
    const draft = resumeId && params.get("new") !== "1" ? demo.drafts.find((d) => d.id === resumeId) : undefined;

    if (draft?.form) {
      setForm(draft.form);
      setDraftId(draft.id);
      const s = stepForKey(draft.currentStep ?? "customer_information", draft.form);
      setAhAutoCounty(draft.form.service === "activation_hero" && !!draft.form.countyId);
      setStep(s);
    } else {
      setForm(
        strictMode
          ? emptyIntakeForm(service, session === "signed_in" ? demo.profile : null)
          : demoIntakeForm(service, demo.profile, new Date()),
      );
    }
  }, [demo, session, service]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const update = useCallback((patch: Partial<IntakeFormData>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
  }, []);

  /** Save the draft (the stand-in for the PATCH calls), then run `after`. */
  const saveAndNext = useCallback(
    async (nextStep: number, after?: () => Promise<void> | void) => {
      if (!form) return;
      skipToRef.current = nextStep;
      const run = async () => {
        setSaving(true);
        setSaveError(null);
        try {
          const saved = await repository.saveDraft({ draftId, form, step: nextStep });
          setDraftId(saved.id);
          retryRef.current = null;
          if (after) await after();
          else setStep(nextStep);
        } catch (err) {
          setSaveError(err instanceof Error ? err.message : "We couldn't save your progress.");
          retryRef.current = run;
        } finally {
          setSaving(false);
        }
      };
      await run();
    },
    [form, draftId],
  );

  if (!form || !demo) {
    return (
      <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div role="status" className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" aria-hidden="true" />
          <p className="text-sm font-medium">Loading your application…</p>
        </div>
      </main>
    );
  }

  const isAH = form.service === "activation_hero";
  const steps = visibleSteps(form.service);
  const navStep = toNavStep(step, form.service);

  const next = () => setStep((s) => s + 1);
  const back = () => {
    if (step === 4 && isAH && ahAutoCounty) return setStep(2);
    if (step === 6 || step === 7) return setStep(5);
    setStep((s) => Math.max(1, s - 1));
  };

  const saveStep1 = () => saveAndNext(2);

  const saveStep2 = () => {
    if (!isAH) return saveAndNext(3);
    // Activation Hero: detect the county from the claimant's address and skip "Filing court" when found.
    return saveAndNext(3, async () => {
      setDetecting(true);
      try {
        const res = await repository.suggestCounties(form.claimantZip, null);
        if (res.claimant) {
          update({ countyId: res.claimant.id, countyName: `${res.claimant.name}, ${res.claimant.state}`, countyState: res.claimant.state });
          setAhAutoCounty(true);
          setStep(4);
        } else {
          setAhAutoCounty(false);
          setStep(3);
        }
      } catch {
        setAhAutoCounty(false);
        setStep(3);
      } finally {
        setDetecting(false);
      }
    });
  };

  const saveStep4 = () => saveAndNext(5);

  const onReviewSubmit = () => setStep(form.mailingPref === "first_class" ? 6 : 7);

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {saveError && (
        <div role="alert" className="mb-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700">{saveError}</p>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => void retryRef.current?.()} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-900">
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveError(null);
                  retryRef.current = null;
                  setStep(skipToRef.current);
                }}
                className="text-xs font-medium text-gray-600 hover:text-gray-800"
              >
                Continue anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <nav aria-label="Application progress" className="mb-8 sm:mb-10 overflow-x-auto pb-2 sm:pb-1">
        <ol className="flex items-center gap-0">
          {steps.map((s, i) => {
            const done = i < navStep;
            const current = i === navStep;
            return (
              <li key={s.label} aria-current={current ? "step" : undefined} className="flex items-center shrink-0">
                <button
                  type="button"
                  disabled={saving || !done}
                  onClick={() => done && setStep(fromNavIndex(i, form.service))}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-opacity rounded",
                    done ? "cursor-pointer hover:opacity-80 text-brand-600" : "cursor-default",
                    current ? "text-brand-600" : !done && "text-gray-500",
                  )}
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                      done || current ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-600",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn("hidden sm:inline", current && "underline underline-offset-2")}>{s.label}</span>
                  <span className="sr-only sm:hidden">{s.label}</span>
                </button>
                {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-2 shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={saving ? "pointer-events-none opacity-60" : ""} aria-busy={saving || undefined}>
        <div key={step} className="animate-fade-in">
          {step === 1 && <StepClaimant strict={strict} form={form} update={update} onNext={saveStep1} saving={saving} />}
          {step === 2 && !detecting && <StepDefendant strict={strict} form={form} update={update} onNext={saveStep2} onBack={back} saving={saving} />}
          {step === 2 && detecting && (
            <div role="status" className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" aria-hidden="true" />
              <p className="text-sm font-medium">Locating your courthouse…</p>
            </div>
          )}
          {step === 3 && <StepFilingCourt strict={strict} form={form} update={update} onNext={next} onBack={back} ahFallback={isAH && !ahAutoCounty} saving={saving} />}
          {step === 4 && <StepClaim strict={strict} form={form} update={update} onNext={saveStep4} onBack={back} saving={saving} />}
          {step === 5 && <StepReview form={form} onBack={back} onSubmit={onReviewSubmit} onEditStep={setStep} />}
          {step === 6 && (
            <StepUpgradeMail
              onAdd={() => {
                update({ mailingPref: "certified" });
                setStep(7);
              }}
              onSkip={() => setStep(7)}
            />
          )}
          {step === 7 && <StepPayment strict={strict} form={form} draftId={draftId} onBack={() => setStep(5)} />}
        </div>
      </div>
    </main>
  );
}
