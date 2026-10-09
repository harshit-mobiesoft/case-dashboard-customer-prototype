"use client";

import { ArrowLeft, ClipboardList, FolderOpen, SkipForward, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { repository } from "@/lib/data/repository";
import { isOrganized } from "@/lib/domain/evidence";
import { QUESTIONS, groupByCategory } from "@/lib/domain/questionnaire";
import { routes } from "@/lib/domain/routes";
import type { CaseRecord } from "@/lib/domain/types";
import { useAsyncAction } from "@/lib/hooks/use-demo";
import { cn } from "@/lib/utils";

type Answer = boolean | "skip" | null;

const OPTIONS = [
  { value: true, label: "Yes", icon: ThumbsUp, on: "bg-green-700 border-green-700 text-white" },
  { value: false, label: "No", icon: ThumbsDown, on: "bg-red-700 border-red-700 text-white" },
  { value: "skip", label: "Skip", icon: SkipForward, on: "bg-gray-700 border-gray-700 text-white" },
] as const;

function YesNoSkip({ name, legend, value, onChange }: { name: string; legend: string; value: Answer; onChange: (v: Exclude<Answer, null>) => void }) {
  return (
    <fieldset className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
      <legend className="sr-only">{legend}</legend>
      <p aria-hidden="true" className="text-[15px] leading-relaxed text-gray-900 mb-4">
        {legend}
      </p>
      <div className="flex gap-2">
        {OPTIONS.map((o) => (
          <label
            key={String(o.value)}
            className={cn(
              "cursor-pointer inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 has-[:focus-visible]:ring-offset-2",
              value === o.value ? o.on : "bg-white border-gray-200 text-gray-700 hover:border-gray-400",
            )}
          >
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <o.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function QuestionnaireView({ c, from }: { c: CaseRecord; from?: "documents" }) {
  const router = useRouter();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [leaving, setLeaving] = useState(false);
  const back = from === "documents" ? routes.documents(c.id) : routes.case(c.id);

  const submit = useAsyncAction(
    (payload: Record<string, boolean>) => repository.submitQuestionnaire(c.id, payload),
    (m) => toast({ title: "Couldn't submit", description: m, variant: "error" }),
  );

  const backLink = (
    <Link href={back} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      Back
    </Link>
  );

  if (leaving) {
    return (
      <main id="main" className="max-w-xl mx-auto px-4 py-16 text-center text-gray-600" role="status">
        Submitting your answers…
      </main>
    );
  }

  if (c.service !== "activation_hero" || c.status !== "paid_pending_claim_type_selection") {
    const done = c.service === "activation_hero" && c.questionnaire !== null;
    return (
      <main id="main" className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        {backLink}
        <div className="mt-6">
          <EmptyState as="h1" icon={ClipboardList} title={done ? "Questionnaire submitted" : "No questionnaire for this case"}>
            <p className="mb-4">
              {done
                ? "Thanks — our team used your answers to select the best claim type."
                : "Only Activation Hero cases waiting on a claim type have a questionnaire."}
            </p>
            <Link href={routes.case(c.id)} className="text-brand-700 font-medium hover:underline">
              Back to your case
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  if (!isOrganized(c)) {
    return (
      <main id="main" className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        {backLink}
        <div className="mt-6">
          <EmptyState as="h1" icon={FolderOpen} title="Get organized first">
            <p className="mb-5">
              Add your evidence (and connect Dropbox) or confirm you don&apos;t have any. Then come back to answer a few
              quick questions.
            </p>
            <Link href={routes.documents(c.id)} className={buttonVariants()}>
              Get organized
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  const answered = QUESTIONS.filter((q) => typeof answers[q.key] === "boolean").length;
  const skipped = QUESTIONS.filter((q) => answers[q.key] === "skip").length;
  const unanswered = QUESTIONS.length - answered - skipped;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, boolean> = {};
    for (const q of QUESTIONS) {
      const a = answers[q.key];
      if (typeof a === "boolean") payload[q.key] = a;
    }
    setLeaving(true);
    const r = await submit.run(payload);
    if (r) {
      toast({ title: "Questionnaire submitted", description: "Our team will prepare your demand letter." });
      router.push(routes.case(c.id));
    } else {
      setLeaving(false);
    }
  }

  return (
    <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        {backLink}
        <h1 className="text-2xl font-bold text-gray-900 mt-2">A few quick questions</h1>
        <p className="text-gray-600 text-sm mt-0.5">
          Your answers help our team choose the strongest approach for your case. Skip anything you&apos;re unsure about.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {groupByCategory(QUESTIONS).map((group) => (
          <section key={group.category} aria-labelledby={`cat-${group.category}`} className="space-y-4">
            <h2 id={`cat-${group.category}`} className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              {group.category}
            </h2>
            {group.questions.map((q) => (
              <YesNoSkip
                key={q.key}
                name={q.key}
                legend={q.text}
                value={answers[q.key] ?? null}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.key]: v }))}
              />
            ))}
          </section>
        ))}

        {skipped > 0 && (
          <Alert tone="info">
            You skipped {skipped} question{skipped === 1 ? "" : "s"}. That&apos;s fine — they&apos;ll be left out of your
            submission.
          </Alert>
        )}
        {submit.error && <Alert tone="error">{submit.error}</Alert>}

        <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-gray-50/95 backdrop-blur py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-t sm:border-0 border-gray-200">
          <p className="text-sm text-gray-600" aria-live="polite">
            {answered} answered{unanswered > 0 ? ` · ${unanswered} to go` : ""}
          </p>
          <Button type="submit" size="lg" disabled={answered === 0} loading={submit.pending}>
            Submit answers
          </Button>
        </div>
      </form>
    </main>
  );
}
