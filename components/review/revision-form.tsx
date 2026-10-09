"use client";

import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { MIN_REVISION_DETAILS } from "@/lib/domain/transitions";
import { useStrict } from "@/lib/hooks/use-demo";
import { REVISION_REASONS, type RevisionReason } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface Props {
  pending: boolean;
  error: string | null;
  onSubmit: (input: { reasons: RevisionReason[]; details: string }) => void;
  onCancel: () => void;
}

export function RevisionForm({ pending, error, onSubmit, onCancel }: Props) {
  const [reasons, setReasons] = useState<RevisionReason[]>([]);
  const [details, setDetails] = useState("");

  const toggle = (reason: RevisionReason) =>
    setReasons((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));

  const strict = useStrict();
  const canSubmit = !strict || (reasons.length > 0 && details.trim().length >= MIN_REVISION_DETAILS);

  return (
    <form
      aria-labelledby="revision-heading"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ reasons, details });
      }}
      className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden scroll-mt-24"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 id="revision-heading" className="font-semibold text-gray-800">
          Request an edit
        </h2>
        <button type="button" onClick={onCancel} aria-label="Close edit request" className="rounded p-1 text-gray-500 hover:bg-gray-100">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">What needs to change?</legend>
          <div className="flex flex-wrap gap-2">
            {REVISION_REASONS.map((reason) => {
              const on = reasons.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(reason)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-colors",
                    on ? "bg-brand-100 border-brand-400 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  {reason}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="revision-details" className="block text-sm font-medium text-gray-700 mb-1">
            Tell us more{" "}
            <span className="text-gray-500 font-normal">
              {strict ? `(min ${MIN_REVISION_DETAILS} characters)` : "(optional)"}
            </span>
          </label>
          <textarea
            id="revision-details"
            rows={3}
            maxLength={1000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe specifically what needs to be changed…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 resize-none"
          />
          {strict && (
            <p className="text-xs text-gray-500 mt-1" aria-live="polite">
              {details.trim().length} / {MIN_REVISION_DETAILS} min characters
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || pending}
          className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Submit edit request
        </button>
      </div>
    </form>
  );
}
