"use client";

import { Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EVIDENCE_TYPE_LABELS } from "@/lib/domain/labels";
import { EVIDENCE_TYPES, type EvidenceItem, type EvidenceType } from "@/lib/domain/types";
import { formatBytes } from "@/lib/format";

const MAX_FILES = 10;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export interface EvidenceFormValues {
  title: string;
  type: EvidenceType;
  notes: string;
  files: { name: string; sizeBytes: number }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing an existing item, or prefilled from a suggestion; null for a blank form. */
  initial: Pick<EvidenceItem, "title" | "type" | "notes"> | null;
  editing: boolean;
  dropboxConnected: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (values: EvidenceFormValues) => void;
}

export function EvidenceDialog(props: Props) {
  // Remount the form whenever it opens so state always starts from `initial`.
  return (
    <Dialog
      open={props.open}
      onOpenChange={(o) => !props.pending && props.onOpenChange(o)}
      title={props.editing ? "Edit evidence" : "Add evidence"}
      description="Log something that supports your claim. Files are stored in your Dropbox."
    >
      {props.open && <EvidenceForm {...props} />}
    </Dialog>
  );
}

function EvidenceForm({ initial, editing, dropboxConnected, pending, error, onSubmit, onOpenChange }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<EvidenceType>(initial?.type ?? "other");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [files, setFiles] = useState<EvidenceFormValues["files"]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const titleError = attempted && title.trim() === "" ? "Give this evidence a short title." : null;

  function pickFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).map((f) => ({ name: f.name, sizeBytes: f.size }));
    const tooBig = picked.find((f) => f.sizeBytes > MAX_FILE_BYTES);
    if (tooBig) return setFileError(`“${tooBig.name}” is larger than 25 MB.`);
    if (files.length + picked.length > MAX_FILES) return setFileError(`You can attach up to ${MAX_FILES} files at a time.`);
    setFileError(null);
    setFiles((prev) => [...prev, ...picked]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (title.trim() === "") return;
    onSubmit({ title, type, notes, files });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        placeholder="e.g. Signed contract"
        error={titleError}
        required
        autoFocus
      />
      <SelectField
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as EvidenceType)}
        options={EVIDENCE_TYPES.map((t) => ({ value: t, label: EVIDENCE_TYPE_LABELS[t] }))}
      />
      <TextAreaField
        label="Notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional — what does this show?"
      />

      <div>
        <p className="text-sm font-medium text-gray-800 mb-1.5">{editing ? "Add more files" : "Files"}</p>
        <input
          ref={inputRef}
          id="evidence-files"
          type="file"
          multiple
          disabled={!dropboxConnected}
          onChange={(e) => pickFiles(e.target.files)}
          className="sr-only"
          aria-describedby="evidence-files-hint"
        />
        <label
          htmlFor="evidence-files"
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            dropboxConnected
              ? "cursor-pointer border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus-within:ring-2"
              : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
          }`}
        >
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          Choose files
        </label>
        <p id="evidence-files-hint" className="text-xs text-gray-600 mt-1.5">
          {dropboxConnected
            ? "Prototype: only file names are kept — nothing is uploaded."
            : "Connect your Dropbox first — evidence files are stored there."}
        </p>
        {fileError && (
          <p className="text-xs text-red-700 mt-1" role="alert">
            {fileError}
          </p>
        )}
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="truncate">
                  {f.name} <span className="text-gray-600">· {formatBytes(f.sizeBytes)}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="rounded p-0.5 text-gray-500 hover:bg-gray-200"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Add evidence"}
        </Button>
      </div>
    </form>
  );
}
