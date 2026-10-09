"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { repository } from "@/lib/data/repository";
import { TASK_FORMS, validateTaskFields } from "@/lib/domain/tasks";
import type { CourtTask } from "@/lib/domain/types";
import { useAsyncAction, useStrict } from "@/lib/hooks/use-demo";

export function TaskForm({ caseId, task }: { caseId: string; task: CourtTask }) {
  const { toast } = useToast();
  const [fields, setFields] = useState<Record<string, string>>(task.submission?.fields ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = useAsyncAction(
    () => repository.submitTask(caseId, task.id, fields),
    (message) => toast({ title: "Couldn't submit this step", description: message, variant: "error" }),
  );
  const resubmitting = task.status === "rejected";
  const strict = useStrict();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = strict ? validateTaskFields(task.type, fields) : {};
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const result = await submit.run();
    if (result) toast({ title: "Submitted for review", description: "Our team will check it and unlock the next step." });
  }

  const set = (name: string, value: string) => {
    setFields((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={task.title} className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      {task.externalUrl && (
        <a
          href={task.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
        >
          Open the court website
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}

      {TASK_FORMS[task.type].map((field) => {
        const error = errors[field.name] || null;
        if (field.kind === "checkbox") {
          return (
            <CheckboxField
              key={field.name}
              label={field.label}
              checked={fields[field.name] === "true"}
              onChange={(e) => set(field.name, e.target.checked ? "true" : "")}
              error={error}
            />
          );
        }
        if (field.kind === "textarea") {
          return (
            <TextAreaField
              key={field.name}
              label={field.label}
              rows={3}
              placeholder={field.placeholder}
              value={fields[field.name] ?? ""}
              onChange={(e) => set(field.name, e.target.value)}
              error={error}
            />
          );
        }
        return (
          <TextField
            key={field.name}
            label={field.label}
            type={field.kind}
            required={field.required}
            placeholder={field.placeholder}
            hint={field.hint}
            value={fields[field.name] ?? ""}
            onChange={(e) => set(field.name, e.target.value)}
            error={error}
          />
        );
      })}

      {submit.error && <Alert tone="error">{submit.error}</Alert>}

      <Button type="submit" size="sm" loading={submit.pending}>
        {submit.pending ? "Submitting…" : resubmitting ? "Resubmit for review" : "Submit for review"}
      </Button>
    </form>
  );
}
