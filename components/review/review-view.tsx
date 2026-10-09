"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Clock, FileText, History, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { repository } from "@/lib/data/repository";
import { ACTIVITY_LABELS } from "@/lib/domain/labels";
import { buildLetter, latestVersion } from "@/lib/domain/letter";
import { routes } from "@/lib/domain/routes";
import type { CaseRecord, LetterVersion, Profile, RevisionReason } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { useAsyncAction } from "@/lib/hooks/use-demo";
import { cn } from "@/lib/utils";
import { LetterPaper } from "./letter-paper";
import { RevisionForm } from "./revision-form";
import { SignDialog } from "./sign-dialog";

const STEP_PILLS = ["Intake complete", "Letter prepared", "Review & sign", "Sent to defendant"] as const;

const VERSION_LABELS: Record<LetterVersion["source"], string> = {
  system_generated: "Original letter generated",
  agent_edit: "Revised based on your feedback",
};

export function ReviewView({ c, profile }: { c: CaseRecord; profile: Profile; now: Date }) {
  const { toast } = useToast();
  const [signOpen, setSignOpen] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [submittedRevision, setSubmittedRevision] = useState(false);
  const revisionRef = useRef<HTMLDivElement>(null);

  const status = c.status;
  const canSignOrRevise = status === "letter_signature_sent";
  const canRevise = status === "letter_signature_sent" || status === "letter_signed";
  const isSigned = status === "letter_signed";
  const isSent = !!c.mailing;
  const legalName = `${profile.firstName} ${profile.lastName}`;
  const latest = latestVersion(c);
  const versions = c.letter.versions;

  const sign = useAsyncAction((name: string) => repository.signLetter(c.id, name));
  const revise = useAsyncAction((input: { reasons: RevisionReason[]; details: string }) =>
    repository.requestRevision(c.id, input),
  );

  // "Need changes? Request an edit" on the case page links here with ?edit=1.
  const handledEditParam = useRef(false);
  useEffect(() => {
    if (handledEditParam.current || !canRevise) return;
    handledEditParam.current = true;
    if (new URLSearchParams(window.location.search).get("edit") === "1") setShowRevision(true);
  }, [canRevise]);

  useEffect(() => {
    if (showRevision) revisionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [showRevision]);

  async function handleSign(name: string) {
    const result = await sign.run(name);
    if (result) {
      setSignOpen(false);
      toast({ title: "Letter signed", description: "Next, send it to the defendant from your case page." });
    }
  }

  async function handleRevise(input: { reasons: RevisionReason[]; details: string }) {
    const result = await revise.run(input);
    if (result) {
      setShowRevision(false);
      setSubmittedRevision(true);
    }
  }

  if (submittedRevision) {
    return (
      <main id="main" className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-amber-700" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit request submitted</h1>
        <p className="text-gray-500 mb-8">
          Our team will review your feedback and prepare a revised letter. You&apos;ll receive an email when it&apos;s
          ready.
        </p>
        <Link href={routes.case(c.id)} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back to my case
        </Link>
      </main>
    );
  }

  if (!latest) {
    return (
      <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link href={routes.case(c.id)} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to case
        </Link>
        <div className="mt-6">
          <EmptyState as="h1" icon={Clock} title="Your letter isn't ready yet">
            Our team is still preparing it. We&apos;ll ask you to review and sign as soon as it&apos;s ready.
          </EmptyState>
        </div>
      </main>
    );
  }

  const content = buildLetter(c, profile, latest);

  return (
    <main id="main" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <Link href={routes.dashboard} className="hover:underline">
          My cases
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={routes.case(c.id)} className="hover:underline">
          vs. {c.defendant.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span aria-current="page">Review &amp; sign</span>
      </nav>
      <h1 className="sr-only">Review and sign your demand letter</h1>

      <ol aria-label="Progress" className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEP_PILLS.map((pill, i) => {
          const complete = i < 2 || (i === 2 && (isSigned || isSent)) || (i === 3 && isSent);
          const active = (i === 2 && canSignOrRevise) || (i === 3 && isSigned);
          return (
            <li key={pill} aria-current={active ? "step" : undefined} className="flex items-center gap-1 shrink-0">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  complete ? "bg-green-100 text-green-800" : active ? "bg-brand-100 text-brand-800" : "bg-gray-100 text-gray-600",
                )}
              >
                {complete && <CheckCircle2 className="h-3 w-3 inline mr-1" aria-hidden="true" />}
                {pill}
              </span>
              {i < STEP_PILLS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <section aria-labelledby="letter-heading" className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <h2 id="letter-heading" className="font-semibold text-gray-800">
                  Your demand letter
                </h2>
              </div>
              {latest.number > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                  Revision {latest.number - 1} applied
                </span>
              )}
            </div>
            <LetterPaper letter={content} signaturePending={canSignOrRevise} />
          </section>

          {showRevision && canRevise && (
            <div ref={revisionRef}>
              <RevisionForm
                pending={revise.pending}
                error={revise.error}
                onSubmit={(input) => void handleRevise(input)}
                onCancel={() => setShowRevision(false)}
              />
            </div>
          )}
        </div>

        <aside aria-label="Signing" className="space-y-4">
          {canSignOrRevise ? (
            <>
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-3">Ready to sign?</h2>
                <p className="text-sm text-gray-500 mb-3">
                  Sign your demand letter directly in this page — once signed, we mail it to the defendant.
                </p>
                <Button onClick={() => setSignOpen(true)} className="w-full mb-3">
                  Sign now
                </Button>
                <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  You can also sign via the email we sent — check your spam folder if you don&apos;t see it.
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-2">Need changes?</h2>
                <p className="text-sm text-gray-500 mb-3">We&apos;ll revise the letter based on your feedback.</p>
                <button
                  type="button"
                  onClick={() => setShowRevision(true)}
                  className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
                >
                  Request an edit
                </button>
              </section>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-amber-800">
                  The 21-day response window starts when the letter is mailed — not when you sign.
                </p>
              </div>
            </>
          ) : isSigned ? (
            <>
              <section className="bg-green-50 border border-green-200 rounded-xl p-5" role="status">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0" aria-hidden="true" />
                  <h2 className="font-semibold text-green-900">Letter signed!</h2>
                </div>
                {c.letter.signedAt && <p className="text-xs text-green-800 mb-3">Signed on {formatDate(c.letter.signedAt)}.</p>}
                <Link href={routes.case(c.id)} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to my case
                </Link>
              </section>
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-2">Need changes?</h2>
                <p className="text-sm text-gray-500 mb-3">You can still request edits before the letter is mailed.</p>
                <button
                  type="button"
                  onClick={() => setShowRevision(true)}
                  className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
                >
                  Request an edit
                </button>
              </section>
            </>
          ) : isSent ? (
            <section className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0" aria-hidden="true" />
                <h2 className="font-semibold text-green-900">Letter sent to defendant</h2>
              </div>
              <Link href={routes.case(c.id)} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to my case
              </Link>
            </section>
          ) : (
            <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-1">Letter preview</h2>
              <p className="text-sm text-gray-600">Signing and edit requests are not available at this stage.</p>
            </section>
          )}

          {versions.length > 1 && (
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <History className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                <h2 className="font-semibold text-gray-800 text-sm">Version history</h2>
              </div>
              <ul className="space-y-3">
                {[...versions].reverse().map((v) => (
                  <li key={v.id} className="text-xs">
                    <p className="text-gray-700">
                      Version {v.number} — {VERSION_LABELS[v.source]}
                    </p>
                    <p className="text-gray-500 mt-0.5">{formatDate(v.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {c.activity.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-3 text-sm">Activity</h2>
              <ul className="space-y-3">
                {[...c.activity]
                  .reverse()
                  .slice(0, 6)
                  .map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 leading-snug">{ACTIVITY_LABELS[a.type]}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(a.at)}</p>
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <SignDialog
        open={signOpen}
        onOpenChange={(o) => {
          setSignOpen(o);
          if (!o) sign.clearError();
        }}
        legalName={legalName}
        pending={sign.pending}
        error={sign.error}
        onSign={(name) => void handleSign(name)}
      />
    </main>
  );
}
