"use client";

import { format } from "date-fns";
import { useState } from "react";
import { TextAreaField, TextField } from "@/components/ui/field";
import { ACTIVATION_HERO_CATEGORIES, SMALL_CLAIMS_CATEGORIES } from "@/lib/domain/directory";
import { MAX_CLAIM_WORDS, validateClaim, type FieldErrors } from "@/lib/domain/intake-validation";
import { CERTIFIED_MAIL_UPSELL_CENTS } from "@/lib/domain/pricing";
import type { MailingMethod } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { countWords } from "@/lib/words";
import { cn } from "@/lib/utils";
import { StepActions } from "./step-actions";
import type { StepProps } from "./step-claimant";

export function StepClaim({ form, update, onNext, onBack, saving, strict }: StepProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const isAH = form.service === "activation_hero";
  const categories = isAH ? ACTIVATION_HERO_CATEGORIES : SMALL_CLAIMS_CATEGORIES;

  const words = countWords(form.claimDescription);
  const over = words > MAX_CLAIM_WORDS;
  const pct = Math.min((words / MAX_CLAIM_WORDS) * 100, 100);
  // The picker can't offer a future date at all (local date, not UTC, so evenings don't drift a day).
  const today = format(new Date(), "yyyy-MM-dd");

  const clear = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  function toggleCategory(value: string) {
    if (isAH) {
      const on = form.claimCategories.includes(value);
      update({ claimCategories: on ? form.claimCategories.filter((c) => c !== value) : [...form.claimCategories, value] });
    } else {
      update({ claimCategories: [value] });
    }
    clear("claimCategories");
  }

  function handleContinue() {
    const errs = strict ? validateClaim(form, new Date()) : {};
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  const OptionCard = ({
    selected,
    onClick,
    role,
    children,
    invalid,
  }: {
    selected: boolean;
    onClick: () => void;
    role: "radio" | "checkbox";
    children: React.ReactNode;
    invalid?: boolean;
  }) => (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border-2 text-left transition-colors",
        selected ? "border-brand-500 bg-brand-50" : invalid ? "border-red-300 hover:border-red-400" : "border-gray-200 hover:border-gray-300",
      )}
    >
      {children}
    </button>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your claim</h1>
      <p className="text-gray-500 text-sm mb-8">
        {isAH
          ? "Select all categories that apply to your deactivation, then describe what happened."
          : "Select the category that best describes your claim, then provide details."}
      </p>

      <div className="mb-6">
        <p id="category-label" className="text-sm font-medium text-gray-700 mb-3">
          Claim category{isAH ? " (select all that apply)" : ""}
        </p>
        <div role={isAH ? "group" : "radiogroup"} aria-labelledby="category-label" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat) => {
            const selected = form.claimCategories.includes(cat.value);
            return (
              <OptionCard key={cat.value} selected={selected} role={isAH ? "checkbox" : "radio"} onClick={() => toggleCategory(cat.value)}>
                <p className={cn("font-medium text-sm", selected ? "text-brand-700" : "text-gray-700")}>{cat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
              </OptionCard>
            );
          })}
        </div>
        {errors.claimCategories && (
          <p className="text-xs text-red-700 mt-2" role="alert">
            {errors.claimCategories}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <TextField
          label={isAH ? "Date of deactivation" : "Date of incident"}
          type="date"
          max={today}
          value={form.incidentDate}
          error={errors.incidentDate}
          onChange={(e) => {
            update({ incidentDate: e.target.value });
            clear("incidentDate");
          }}
        />
        <TextField
          label={isAH ? "Estimated lost earnings ($)" : "Amount claimed ($)"}
          type="text"
          inputMode="decimal"
          prefix="$"
          value={form.claimAmount}
          placeholder={isAH ? "3,000" : "3,500"}
          hint={
            isAH
              ? "Approximate the total earnings you have lost since you were deactivated. Make your best guess and avoid extreme estimates a judge wouldn't believe."
              : undefined
          }
          error={errors.claimAmount}
          onChange={(e) => {
            update({ claimAmount: e.target.value.replace(/[^\d.]/g, "") });
            clear("claimAmount");
          }}
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {isAH ? "Describe your deactivation" : "Describe your claim"} <span className="text-red-600" aria-hidden="true">*</span>
          </span>
          <span className={cn("text-xs font-medium", over ? "text-red-700" : words > 0 ? "text-green-700" : "text-gray-500")} aria-live="polite">
            {words} / {MAX_CLAIM_WORDS} words
          </span>
        </div>
        <TextAreaField
          label={isAH ? "Describe your deactivation" : "Describe your claim"}
          fieldClassName="[&>label]:sr-only"
          rows={7}
          value={form.claimDescription}
          error={errors.claimDescription}
          placeholder={
            isAH
              ? "Describe what happened: when you were deactivated, what reason (if any) was given, what you believe caused it, and any steps you've already taken to resolve it."
              : "Describe what happened, when it happened, what you've tried, and why you're owed this amount. Include specific dates, amounts, and any relevant details."
          }
          onChange={(e) => {
            update({ claimDescription: e.target.value });
            clear("claimDescription");
          }}
        />
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
          <div
            className={cn("h-full rounded-full transition-all duration-300", over ? "bg-red-500" : pct >= 100 ? "bg-green-500" : "bg-brand-400")}
            style={{ width: `${pct}%` }}
          />
        </div>
        {over && !errors.claimDescription && (
          <p className="text-xs text-red-700 mt-1">
            {words - MAX_CLAIM_WORDS} word{words - MAX_CLAIM_WORDS !== 1 ? "s" : ""} over the limit — please shorten your description.
          </p>
        )}
      </div>

      <div className="mb-6">
        <p id="evidence-label" className="text-sm font-medium text-gray-700 mb-1">
          Do you have evidence to upload?
        </p>
        <p className="text-xs text-gray-500 mb-3">Evidence can be uploaded in your dashboard after checkout.</p>
        <div role="radiogroup" aria-labelledby="evidence-label" className="grid grid-cols-2 gap-3">
          {(
            [
              { value: true, label: "Yes, I have evidence", desc: "Evidence can be uploaded in your dashboard after checkout." },
              { value: false, label: "No, not right now", desc: "You can still add evidence later." },
            ] as const
          ).map((opt) => {
            const on = form.hasEvidenceToUpload === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  update({ hasEvidenceToUpload: opt.value });
                  clear("hasEvidenceToUpload");
                }}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-colors",
                  on ? "border-brand-500 bg-brand-50" : errors.hasEvidenceToUpload ? "border-red-300 hover:border-red-400" : "border-gray-200 hover:border-gray-300",
                )}
              >
                <p className={cn("font-medium text-sm", on ? "text-brand-700" : "text-gray-700")}>{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>
        {errors.hasEvidenceToUpload && (
          <p className="text-xs text-red-700 mt-2" role="alert">
            {errors.hasEvidenceToUpload}
          </p>
        )}
      </div>

      <div className="mb-6">
        <p id="mailing-label" className="text-sm font-medium text-gray-700 mb-3">
          Mailing method
        </p>
        <div role="radiogroup" aria-labelledby="mailing-label" className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "first_class", label: "First class mail", desc: "Standard USPS mail, no confirmation", price: "Included" },
              {
                value: "certified",
                label: "Certified mail",
                desc: "Tracking + delivery confirmation (recommended)",
                price: `+${formatCurrency(CERTIFIED_MAIL_UPSELL_CENTS / 100)}`,
              },
            ] as { value: MailingMethod; label: string; desc: string; price: string }[]
          ).map((m) => {
            const on = form.mailingPref === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  update({ mailingPref: m.value });
                  clear("mailingPref");
                }}
                className={cn("p-4 rounded-xl border-2 text-left transition-colors", on ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300")}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p className={cn("font-medium text-sm", on ? "text-brand-700" : "text-gray-700")}>{m.label}</p>
                  <span className={cn("text-xs font-semibold", m.value === "certified" ? "text-brand-700" : "text-gray-500")}>{m.price}</span>
                </div>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </button>
            );
          })}
        </div>
        {errors.mailingPref && (
          <p className="text-xs text-red-700 mt-2" role="alert">
            {errors.mailingPref}
          </p>
        )}
      </div>

      <StepActions
        hasErrors={Object.keys(errors).length > 0}
        onBack={onBack}
        onNext={handleContinue}
        busy={saving}
        nextLabel="Review my claim"
      />
    </div>
  );
}
