"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Cloud,
  Download,
  FileText,
  FolderOpen,
  Lightbulb,
  Mail,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { repository } from "@/lib/data/repository";
import { downloadTextFile } from "@/lib/download";
import { getDocuments, renderDocumentText, type CaseDocument } from "@/lib/domain/documents";
import { isOrganized } from "@/lib/domain/evidence";
import { getEvidenceSuggestions, type EvidenceSuggestion } from "@/lib/domain/evidence-suggestions";
import { EVIDENCE_TYPE_LABELS, MAILING_METHOD_LABELS } from "@/lib/domain/labels";
import { routes } from "@/lib/domain/routes";
import type { CaseRecord, EvidenceItem, Profile } from "@/lib/domain/types";
import { formatBytes, formatDate } from "@/lib/format";
import { useAsyncAction, useOptimisticValue } from "@/lib/hooks/use-demo";
import { EvidenceDialog, type EvidenceFormValues } from "./evidence-dialog";

type DialogState =
  | { mode: "closed" }
  | { mode: "add"; initial: Pick<EvidenceItem, "title" | "type" | "notes"> | null }
  | { mode: "edit"; item: EvidenceItem };

export function DocumentsView({ c, profile }: { c: CaseRecord; profile: Profile; now: Date }) {
  const { toast } = useToast();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [deleteTarget, setDeleteTarget] = useState<EvidenceItem | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const fail = (title: string) => (message: string) => toast({ title, description: message, variant: "error" });
  const readOnly = c.status === "closed";
  const organized = isOrganized(c);
  const noEvidenceChoice = useOptimisticValue(c.hasEvidenceToUpload === false);
  const noEvidence = noEvidenceChoice.value;
  const suggestions = readOnly ? [] : getEvidenceSuggestions(c);
  const documents = getDocuments(c);
  const docByKind = (kind: CaseDocument["kind"]) => documents.find((d) => d.kind === kind) ?? null;

  const connect = useAsyncAction(() => repository.connectDropbox(c.id), fail("Couldn't connect Dropbox"));
  const disconnect = useAsyncAction(() => repository.disconnectDropbox(c.id), fail("Couldn't disconnect Dropbox"));
  const toggleNoEvidence = useAsyncAction(
    (v: boolean) => repository.setNoEvidence(c.id, v),
    fail("Couldn't save your preference"),
  );
  const save = useAsyncAction(async (values: EvidenceFormValues) => {
    if (dialog.mode === "edit") return repository.updateEvidence(c.id, dialog.item.id, values);
    return repository.addEvidence(c.id, values);
  });
  const remove = useAsyncAction(
    (itemId: string) => repository.removeEvidence(c.id, itemId),
    fail("Couldn't remove the evidence"),
  );

  async function handleConnect() {
    const r = await connect.run();
    if (r) toast({ title: "Dropbox connected" });
  }

  async function handleDisconnect() {
    setConfirmDisconnect(false);
    const r = await disconnect.run();
    if (r) toast({ title: "Dropbox disconnected" });
  }

  async function handleSave(values: EvidenceFormValues) {
    const editing = dialog.mode === "edit";
    const r = await save.run(values);
    if (r) {
      setDialog({ mode: "closed" });
      toast({ title: editing ? "Evidence updated" : "Evidence added" });
    }
  }

  async function handleRemove() {
    if (!deleteTarget) return;
    const r = await remove.run(deleteTarget.id);
    setDeleteTarget(null);
    if (r) toast({ title: "Evidence removed" });
  }

  async function handleNoEvidence(checked: boolean) {
    noEvidenceChoice.begin(checked);
    await toggleNoEvidence.run(checked);
    noEvidenceChoice.settle();
  }

  function handleDownload(doc: CaseDocument) {
    downloadTextFile(doc.fileName, renderDocumentText(doc, c, profile));
    toast({ title: "Download started", description: `${doc.fileName} (prototype text copy)` });
  }

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link href={routes.dashboard} className="hover:underline">
              My cases
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link href={routes.case(c.id)} className="hover:underline">
              vs. {c.defendant.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-current="page">Documents</span>
          </nav>
          <Link href={routes.case(c.id)} className="flex items-center gap-1.5 text-sm text-brand-700 hover:underline shrink-0">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Return to case
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Case documents</h1>
      </div>

      {c.service === "activation_hero" && c.status === "paid_pending_claim_type_selection" && (
        <Alert tone={organized ? "success" : "info"}>
          {organized ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">You&apos;re organized — next, answer a few quick questions.</span>
              <Link href={routes.questionnaire(c.id, "documents")} className="inline-flex items-center gap-1 font-medium underline">
                Start questionnaire <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </span>
          ) : (
            "Add your evidence (and connect Dropbox) or confirm you have none. The questionnaire unlocks after that."
          )}
        </Alert>
      )}

      {/* Dropbox */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <h2 className="font-semibold text-gray-900">Dropbox</h2>
          </div>
          <Badge variant={c.dropbox.connected ? "success" : "outline"}>
            {c.dropbox.connected ? "Connected" : "Not connected"}
          </Badge>
        </CardHeader>
        <CardBody>
          {c.dropbox.connected ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-700">
                Connected as <span className="font-medium">{c.dropbox.accountEmail}</span>
                {c.dropbox.connectedAt && ` · since ${formatDate(c.dropbox.connectedAt)}`}. Your evidence and signed
                letter are kept in your own Dropbox.
              </p>
              {!readOnly && (
                <Button variant="outline" size="sm" onClick={() => setConfirmDisconnect(true)} loading={disconnect.pending}>
                  Disconnect
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-700 max-w-xl">
                Connect your free Dropbox so you have a copy of your evidence and signed letter for your records.
                Evidence files are stored there.
              </p>
              {!readOnly && (
                <Button onClick={() => void handleConnect()} loading={connect.pending}>
                  {connect.pending ? "Connecting…" : "Connect Dropbox"}
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Evidence */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <h2 className="font-semibold text-gray-900">
              Your evidence <span className="text-gray-500 font-normal">· {c.evidence.length}</span>
            </h2>
          </div>
          {!readOnly && (
            <Button size="sm" onClick={() => setDialog({ mode: "add", initial: null })}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add evidence
            </Button>
          )}
        </CardHeader>
        <CardBody className="space-y-5">
          {c.evidence.length === 0 ? (
            <p className="text-sm text-gray-600">
              {noEvidence ? "You've confirmed you have no evidence to add." : "Nothing logged yet."}
            </p>
          ) : (
            <ul aria-label="Evidence items" className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
              {c.evidence.map((item) => (
                <li key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                      {item.title}
                      <Badge variant="outline">{EVIDENCE_TYPE_LABELS[item.type]}</Badge>
                    </p>
                    {item.notes && <p className="text-sm text-gray-600 mt-0.5">{item.notes}</p>}
                    {item.files.length > 0 && (
                      <ul className="mt-2 space-y-0.5" aria-label={`Files for ${item.title}`}>
                        {item.files.map((f) => (
                          <li key={f.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Paperclip className="h-3 w-3 text-gray-500" aria-hidden="true" />
                            {f.name} <span className="text-gray-500">· {formatBytes(f.sizeBytes)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${item.title}`}
                        onClick={() => setDialog({ mode: "edit", item })}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${item.title}`}
                        className="text-gray-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {c.evidence.length > 0 && !c.dropbox.connected && (
            <Alert tone="warning">Connect your Dropbox so your evidence files have somewhere to live.</Alert>
          )}

          {!readOnly && (
            <div className="space-y-1">
              <CheckboxField
                label="I don't have any evidence to add"
                checked={noEvidence}
                disabled={c.evidence.length > 0 || toggleNoEvidence.pending}
                onChange={(e) => void handleNoEvidence(e.target.checked)}
              />
              {c.evidence.length > 0 && (
                <p className="text-xs text-gray-600 ml-6">Remove your evidence items to use this option.</p>
              )}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-brand-900 mb-2">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                Suggested evidence to gather
              </h3>
              <ul className="flex flex-wrap gap-2">
                {suggestions.map((s: EvidenceSuggestion) => (
                  <li key={s.title}>
                    <button
                      type="button"
                      onClick={() => setDialog({ mode: "add", initial: { title: s.title, type: s.type, notes: "" } })}
                      className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white px-3 py-1 text-sm text-brand-900 hover:bg-brand-100"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Documents */}
      {c.status === "closed" && (
        <section aria-labelledby="doc-summary-heading">
          <h2 id="doc-summary-heading" className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Case summary
          </h2>
          <DocRow doc={docByKind("case_summary")} fallbackLabel="Case summary" fallbackDesc="Complete record of your case — all phases, tasks, and outcomes." tone="green" icon={BookOpen} onDownload={handleDownload} />
        </section>
      )}

      <section aria-labelledby="doc-intake-heading">
        <h2 id="doc-intake-heading" className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Intake summary
        </h2>
        <DocRow doc={docByKind("intake_summary")} fallbackLabel="Intake summary" fallbackDesc="A copy of your original filing information." icon={FileText} onDownload={handleDownload} />
      </section>

      <section aria-labelledby="doc-phase1-heading">
        <h2 id="doc-phase1-heading" className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Phase 1 — Demand letter
        </h2>
        <div className="space-y-2">
          <DocRow doc={docByKind("signed_letter")} fallbackLabel="Signed demand letter" fallbackDesc="Available after signing." icon={FileText} onDownload={handleDownload} />
          <DocRow doc={docByKind("mailing_proof")} fallbackLabel={MAILING_METHOD_LABELS[c.mailingMethod]} fallbackDesc="Available after mailing." icon={Mail} onDownload={handleDownload} />
          {c.mailing && c.mailingMethod === "certified" && (
            <DocRow doc={docByKind("certified_receipt")} fallbackLabel="Certificate of Mailing Submission" fallbackDesc="Will be available after mailing is verified." icon={FileText} onDownload={handleDownload} />
          )}
        </div>
        {c.letter.versions.length > 0 && !c.mailing && (
          <Link href={routes.review(c.id)} className={buttonVariants({ variant: "ghost", size: "sm" }) + " mt-3 -ml-3"}>
            View demand letter
          </Link>
        )}
      </section>

      <EvidenceDialog
        open={dialog.mode !== "closed"}
        onOpenChange={(o) => {
          if (!o) {
            setDialog({ mode: "closed" });
            save.clearError();
          }
        }}
        initial={dialog.mode === "edit" ? dialog.item : dialog.mode === "add" ? dialog.initial : null}
        editing={dialog.mode === "edit"}
        dropboxConnected={c.dropbox.connected}
        pending={save.pending}
        error={save.error}
        onSubmit={(v) => void handleSave(v)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this evidence?"
        description={deleteTarget ? `“${deleteTarget.title}” and its file names will be removed from your case.` : undefined}
        confirmLabel="Delete"
        variant="danger"
        loading={remove.pending}
        onConfirm={() => void handleRemove()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Dropbox?"
        description="Files already in your Dropbox stay there, but you won't be able to add new evidence files until you reconnect."
        confirmLabel="Disconnect"
        variant="danger"
        onConfirm={() => void handleDisconnect()}
        onCancel={() => setConfirmDisconnect(false)}
      />
    </main>
  );
}

function DocRow({
  doc,
  fallbackLabel,
  fallbackDesc,
  icon: Icon,
  tone,
  onDownload,
}: {
  doc: CaseDocument | null;
  fallbackLabel: string;
  fallbackDesc: string;
  icon: typeof FileText;
  tone?: "green";
  onDownload: (doc: CaseDocument) => void;
}) {
  return (
    <div className={`bg-white border ${tone === "green" ? "border-green-200" : "border-gray-200"} rounded-xl p-4 flex items-center gap-4`}>
      <div className={`h-10 w-10 rounded-lg ${tone === "green" ? "bg-green-50" : "bg-gray-100"} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${tone === "green" ? "text-green-600" : "text-gray-500"}`} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{doc?.label ?? fallbackLabel}</p>
        <p className="text-xs text-gray-500 mt-0.5">{doc?.description ?? fallbackDesc}</p>
      </div>
      {doc ? (
        <button
          type="button"
          onClick={() => onDownload(doc)}
          aria-label={`Download ${doc.label}`}
          className="flex items-center gap-1.5 text-sm text-brand-700 hover:underline shrink-0"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download
        </button>
      ) : (
        <span className="text-xs text-gray-500">Not yet available</span>
      )}
    </div>
  );
}
