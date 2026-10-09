"use client";

import { CheckCircle2, ExternalLink, FileText, LifeBuoy, MapPin, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { CourtFilingSection } from "@/components/court-filing/court-filing-section";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { SUPPORT_URL } from "@/lib/config";
import { repository } from "@/lib/data/repository";
import { CLAIM_TYPE_LABELS, CLAIM_TYPE_PENDING_LABEL, MAILING_METHOD_LABELS } from "@/lib/domain/labels";
import { getPhaseStates } from "@/lib/domain/phases";
import { routes } from "@/lib/domain/routes";
import { getLetterSteps, getResponseSteps } from "@/lib/domain/steps";
import { isResponseWindowExpired, resolveDropboxBar, resolveStatusBar } from "@/lib/domain/status";
import type { CaseRecord } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAsyncAction, useOptimisticValue } from "@/lib/hooks/use-demo";
import { cn } from "@/lib/utils";
import { ActivityCard } from "./activity-card";
import { DemoNextStep } from "@/components/demo/demo-next-step";
import { PhaseCard } from "./phase-card";
import { ResponseWindowCard } from "./response-window-card";
import { StatusBanner } from "./status-banner";
import { StepTimeline } from "./step-timeline";

export function CaseView({ c, now }: { c: CaseRecord; now: Date }) {
  const { toast } = useToast();
  const statusBar = resolveStatusBar(c, now);
  const dropboxBar = resolveDropboxBar(c, statusBar);
  const phases = getPhaseStates(c);
  const fail = (title: string) => (message: string) => toast({ title, description: message, variant: "error" });

  const sendMailing = useAsyncAction(() => repository.sendMailing(c.id), fail("Couldn't send the letter"));
  const closeCase = useAsyncAction(() => repository.closeCase(c.id), fail("Couldn't close the case"));
  const reminder = useAsyncAction(
    (enabled: boolean) => repository.setReminder(c.id, enabled),
    fail("Couldn't update the reminder"),
  );

  const reminderChoice = useOptimisticValue(c.reminderEnabled);

  async function handleReminder(enabled: boolean) {
    reminderChoice.begin(enabled);
    await reminder.run(enabled);
    reminderChoice.settle();
  }

  async function handleSend() {
    const result = await sendMailing.run();
    if (result) toast({ title: "Letter sent", description: "The 21-day response window has started." });
  }

  async function handleClose() {
    const result = await closeCase.run();
    if (result) toast({ title: "Case closed", description: "Your case summary is now in Documents." });
  }

  const claimLabel = c.claimType ? CLAIM_TYPE_LABELS[c.claimType] : CLAIM_TYPE_PENDING_LABEL;
  const countyLabel = `${c.county.name}, ${c.county.state}`;
  const windowOpen = c.status === "mailed" && !isResponseWindowExpired(c, now);

  const stats = [
    { icon: DollarSign, label: "Amount claimed", value: formatCurrency(c.amountCents / 100) },
    { icon: Calendar, label: "Incident date", value: formatDate(c.incidentDate) },
    { icon: MapPin, label: "Filing county", value: countyLabel },
    { icon: FileText, label: "Mailing method", value: MAILING_METHOD_LABELS[c.mailingMethod] },
  ];

  return (
    <>
      <StatusBanner caseId={c.id} info={statusBar} />
      {dropboxBar && <StatusBanner caseId={c.id} info={dropboxBar} secondary />}
      <DemoNextStep c={c} now={now} />

      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Link href={routes.dashboard} className="hover:underline whitespace-nowrap shrink-0">
                My cases
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="truncate">
                vs. {c.defendant.name}
              </span>
            </nav>
            <h1 className="text-2xl font-bold text-gray-900">vs. {c.defendant.name}</h1>
            <p className="text-gray-600 text-sm mt-0.5">
              {claimLabel} · {countyLabel} · <span className="font-mono whitespace-nowrap">Case #{c.referenceCode}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={routes.documents(c.id)} className={buttonVariants({ size: "md" })}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              Manage documents
            </Link>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "md" })}
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Support
            </a>
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <dt className="flex items-center gap-1.5 text-gray-600 mb-1 text-xs">
                <stat.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {stat.label}
              </dt>
              <dd className="font-semibold text-gray-900 text-sm">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <PhaseCard number={1} title="Demand letter" state={phases.letter === "complete" ? "complete" : "active"}>
              <StepTimeline
                label="Demand letter steps"
                steps={getLetterSteps(c, formatDate)}
                onCommand={() => void handleSend()}
                pendingCommand={sendMailing.pending}
              />
              {sendMailing.error && (
                <p role="alert" className="mt-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {sendMailing.error}
                </p>
              )}
            </PhaseCard>

            <PhaseCard
              number={2}
              title="Response & outcome"
              state={phases.response}
              tag="Included"
              inactiveMessage="Unlocks once your letter has been mailed to the defendant."
            >
              <StepTimeline
                label="Response steps"
                steps={getResponseSteps(c, now, formatDate)}
                renderExtra={(step) =>
                  step.id === "window" && windowOpen ? (
                    <label className="mt-2 flex items-center gap-2 text-xs text-gray-700 cursor-pointer w-fit">
                      <Switch
                        checked={reminderChoice.value}
                        disabled={reminder.pending}
                        onCheckedChange={(enabled) => void handleReminder(enabled)}
                        aria-label="Remind me when the response window closes"
                      />
                      {reminderChoice.value ? "Reminder on" : "Remind me when it closes"}
                    </label>
                  ) : null
                }
              />
            </PhaseCard>

            <PhaseCard
              number={3}
              title="Court filing"
              state={phases.court}
              tag="Free bonus"
              inactiveMessage={
                phases.court === "skipped"
                  ? "Not needed — this case was settled before court filing."
                  : "Unlocks after the response window closes if the dispute is unresolved."
              }
            >
              <CourtFilingSection c={c} />
            </PhaseCard>
          </div>

          <aside aria-label="Case sidebar" className="space-y-4">
            {c.status === "letter_signed" && (
              <section aria-label="Action required" className="bg-amber-50 border border-amber-300 rounded-xl p-5">
                <h2 className="font-semibold text-amber-950 mb-1">Action required</h2>
                <p className="text-sm text-amber-900 mb-4">
                  Your letter is signed. Submit it to dispatch via {MAILING_METHOD_LABELS[c.mailingMethod].toLowerCase()}.
                </p>
                <Button className="w-full" size="lg" onClick={() => void handleSend()} loading={sendMailing.pending}>
                  {sendMailing.pending ? "Sending…" : "Send letter to defendant"}
                </Button>
                <Link
                  href={routes.review(c.id, { edit: true })}
                  className="block mt-3 text-center text-sm text-amber-950 underline hover:no-underline"
                >
                  Need changes? Request an edit
                </Link>
              </section>
            )}

            {c.status === "letter_revision_requested" && c.revisionRequest && (
              <section aria-label="Your requested changes" className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">Your requested changes</h2>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {c.revisionRequest.reasons.map((r) => (
                    <Badge key={r} variant="info">
                      {r}
                    </Badge>
                  ))}
                </div>
                {c.revisionRequest.details && (
                  <p className="text-sm text-gray-700">“{c.revisionRequest.details}”</p>
                )}
                <p className="text-xs text-gray-600 mt-2">Requested {formatDate(c.revisionRequest.requestedAt)}</p>
              </section>
            )}

            <ResponseWindowCard c={c} now={now} />

            {c.status === "phase2_completed" && (
              <section aria-label="All tasks complete" className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-700" aria-hidden="true" />
                  <h2 className="font-semibold text-green-950">All tasks complete</h2>
                </div>
                <p className="text-sm text-green-900 mb-4">
                  Every court filing step has been approved. Close the case to generate your case summary.
                </p>
                <Button variant="success" size="lg" className="w-full" onClick={() => void handleClose()} loading={closeCase.pending}>
                  {closeCase.pending ? "Closing…" : "Close case"}
                </Button>
              </section>
            )}

            {c.status === "closed" && (
              <section aria-label="Case closed" className="bg-white border border-green-200 rounded-xl p-5 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" aria-hidden="true" />
                <h2 className="font-semibold text-gray-900 mb-1">Case closed</h2>
                <p className="text-xs text-gray-600 mb-3">Your case summary is available in Documents.</p>
                <Link href={routes.documents(c.id)} className="text-sm text-brand-700 hover:underline">
                  View documents →
                </Link>
              </section>
            )}

            <section aria-labelledby="case-info-heading" className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <h2 id="case-info-heading" className="text-sm font-semibold text-gray-800">
                Case info
              </h2>
              <dl className="space-y-2 text-xs text-gray-600">
                <InfoRow label="Case reference" value={<span className="font-mono text-gray-800">{c.referenceCode}</span>} />
                <InfoRow label="Case opened" value={formatDate(c.createdAt)} />
                {c.mailing && <InfoRow label="Letter mailed" value={formatDate(c.mailing.sentAt)} />}
                {c.mailing?.trackingNumber && (
                  <InfoRow label="Tracking" value={<span className="font-mono">{c.mailing.trackingNumber}</span>} />
                )}
              </dl>
              {c.dropbox.connected && (
                <a
                  href="https://www.dropbox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("flex items-center gap-1 text-xs text-brand-700 hover:underline")}
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  Open my Dropbox folder
                </a>
              )}
            </section>

            <ActivityCard activity={c.activity} now={now} />
          </aside>
        </div>
      </main>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="text-gray-800 text-right">{value}</dd>
    </div>
  );
}
