"use client";

import { useState } from "react";
import { TextField } from "@/components/ui/field";
import { suggestEmailCorrection } from "@/lib/domain/email-typo";
import type { IntakeFormData } from "@/lib/domain/intake";
import { validateClaimant, type FieldErrors } from "@/lib/domain/intake-validation";
import { AddressFields } from "./address-fields";
import { StepActions } from "./step-actions";

export interface StepProps {
  form: IntakeFormData;
  update: (patch: Partial<IntakeFormData>) => void;
  onNext: () => void;
  onBack?: () => void;
  saving?: boolean;
  /** Block Continue until the step validates (`?validate=1`); off by default in the prototype. */
  strict?: boolean;
}

export function StepClaimant({ form, update, onNext, onBack, saving, strict }: StepProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [dismissedEmail, setDismissedEmail] = useState<string | null>(null);
  const isAH = form.service === "activation_hero";

  const clear = (...keys: string[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  function set<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    update({ [key]: value } as Partial<IntakeFormData>);
    clear(key);
  }

  function handleContinue() {
    const errs = strict ? validateClaimant(form) : {};
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your information</h1>
      <p className="text-gray-500 text-sm mb-8">
        {isAH
          ? "Tell us about yourself and the account that was deactivated."
          : "Tell us about yourself — the person filing the claim."}
      </p>

      <div className="space-y-5">
        <TextField
          label="Full legal name"
          value={form.claimantName}
          placeholder="Jane Smith"
          autoComplete="name"
          error={errors.claimantName}
          onChange={(e) => set("claimantName", e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <TextField
              label="Best email address to reach you"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={form.claimantEmail}
              placeholder="jane@example.com"
              hint="Use an email you check regularly. We’ll send updates about your case here."
              error={errors.claimantEmail}
              onChange={(e) => {
                setEmailSuggestion(null);
                set("claimantEmail", e.target.value);
              }}
              onBlur={() => {
                const s = suggestEmailCorrection(form.claimantEmail);
                setEmailSuggestion(s && form.claimantEmail.trim() !== dismissedEmail ? s : null);
              }}
            />
            {emailSuggestion && (
              <div
                role="status"
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
              >
                <p className="min-w-0 break-all">
                  Did you mean <span className="font-semibold">{emailSuggestion}</span>?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      set("claimantEmail", emailSuggestion);
                      setEmailSuggestion(null);
                    }}
                    className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                  >
                    Yes, use it
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDismissedEmail(form.claimantEmail.trim());
                      setEmailSuggestion(null);
                    }}
                    className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  >
                    No, keep mine
                  </button>
                </div>
              </div>
            )}
          </div>
          <TextField
            label="Best phone number to reach you"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.claimantPhone}
            placeholder="(555) 555-0100"
            hint="Use a number you can receive texts and calls on."
            error={errors.claimantPhone}
            onChange={(e) => set("claimantPhone", e.target.value)}
          />
        </div>

        <div className="px-4 py-3 rounded-lg bg-amber-100 border border-amber-200 text-sm text-gray-800 leading-relaxed">
          Please use the <span className="font-semibold">email and phone you check daily</span>. This is how we will
          communicate with you.{" "}
          {isAH
            ? "You will have an opportunity to add the email and phone associated with the gig platform on the next step."
            : "You will also get sent your login link to this email."}
        </div>

        <div className="pt-2">
          <p className="text-sm font-medium text-gray-700 mb-1">Mailing address</p>
          <p className="text-xs text-gray-500 mb-3">This is the return address we will use on your demand letter:</p>
          <AddressFields
            value={{
              country: form.claimantCountry,
              address: form.claimantAddress,
              city: form.claimantCity,
              state: form.claimantState,
              zip: form.claimantZip,
            }}
            errors={{
              country: errors.claimantCountry,
              address: errors.claimantAddress,
              city: errors.claimantCity,
              state: errors.claimantState,
              zip: errors.claimantZip,
            }}
            placeholders={{ address: "123 Main St", city: "Los Angeles", zip: "90001" }}
            onChange={(p) => {
              const patch: Partial<IntakeFormData> = {};
              if (p.country !== undefined) patch.claimantCountry = p.country;
              if (p.address !== undefined) patch.claimantAddress = p.address;
              if (p.city !== undefined) patch.claimantCity = p.city;
              if (p.state !== undefined) patch.claimantState = p.state;
              if (p.zip !== undefined) patch.claimantZip = p.zip;
              update(patch);
              clear(...Object.keys(p).map((k) => `claimant${k[0]!.toUpperCase()}${k.slice(1)}`));
            }}
          />
        </div>
      </div>

      <StepActions hasErrors={Object.keys(errors).length > 0} onBack={onBack} onNext={handleContinue} busy={saving} />
    </div>
  );
}
