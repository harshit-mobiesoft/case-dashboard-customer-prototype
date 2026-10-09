"use client";

import { Building2, User } from "lucide-react";
import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { CheckboxField, TextField } from "@/components/ui/field";
import { BUSINESSES, PLATFORMS } from "@/lib/domain/directory";
import type { IntakeFormData } from "@/lib/domain/intake";
import { validateDefendant, type FieldErrors } from "@/lib/domain/intake-validation";
import { cn } from "@/lib/utils";
import { AddressFields } from "./address-fields";
import { StepActions } from "./step-actions";
import type { StepProps } from "./step-claimant";

const TYPES = [
  { value: "individual", label: "Individual", desc: "A person, landlord, or contractor", icon: User },
  { value: "business", label: "Business", desc: "A company, LLC, or organization", icon: Building2 },
] as const;

export function StepDefendant(props: StepProps) {
  return props.form.service === "activation_hero" ? <PlatformView {...props} /> : <SmallClaimsView {...props} />;
}

// ─── Activation Hero: which platform deactivated you? ────────────────────────

function PlatformView({ form, update, onNext, onBack, saving, strict }: StepProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);

  const sameAsContact =
    form.platformAccountEmail !== "" &&
    form.platformAccountEmail === form.claimantEmail &&
    form.platformAccountPhone === form.claimantPhone;

  const options = PLATFORMS.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).map((p) => ({
    id: p.id,
    label: p.name,
  }));

  const clear = (...keys: string[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  function handleContinue() {
    const errs = strict ? validateDefendant(form) : {};
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Which platform deactivated you?</h1>
      <p className="text-gray-500 text-sm mb-8">Select the company that deactivated your account.</p>

      <div className="mb-8">
        <Combobox
          label="Platform"
          value={typing ? query : form.platformName}
          onInputChange={(t) => {
            setTyping(true);
            setQuery(t);
          }}
          options={options}
          emptyText={query ? `No results for “${query}”` : "No platforms found."}
          selected={!!form.platformId}
          placeholder="Search for your platform…"
          error={errors.platformName}
          onSelect={(o) => {
            update({ platformId: o.id, platformName: o.label, defendantLegalName: o.label, defendantType: "business" });
            setTyping(false);
            setQuery("");
            clear("platformName");
          }}
        />
      </div>

      <div className="mb-8">
        <p className="block text-sm font-medium text-gray-700 mb-1">Your account with this platform</p>
        <p className="text-xs text-gray-500 mb-3">
          The email or phone number tied to your account on this platform. At least one is required.
        </p>

        <div className="mb-3">
          <CheckboxField
            label="Same as my contact information"
            checked={sameAsContact}
            onChange={(e) => {
              update({
                platformAccountEmail: e.target.checked ? form.claimantEmail : "",
                platformAccountPhone: e.target.checked ? form.claimantPhone : "",
              });
              clear("platformAccountEmail", "platformAccountPhone");
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Account email"
            type="email"
            value={form.platformAccountEmail}
            placeholder="you@example.com"
            error={errors.platformAccountEmail}
            onChange={(e) => {
              update({ platformAccountEmail: e.target.value });
              clear("platformAccountEmail");
            }}
          />
          <TextField
            label="Account phone (optional)"
            type="tel"
            value={form.platformAccountPhone}
            placeholder="(555) 555-0100"
            error={errors.platformAccountPhone}
            onChange={(e) => {
              update({ platformAccountPhone: e.target.value });
              clear("platformAccountPhone");
            }}
          />
        </div>
      </div>

      <StepActions hasErrors={Object.keys(errors).length > 0} onBack={onBack} onNext={handleContinue} busy={saving} />
    </div>
  );
}

// ─── Small Claims: who are you filing against? ───────────────────────────────

function SmallClaimsView({ form, update, onNext, onBack, saving, strict }: StepProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  // Names typed under each type are remembered so toggling Individual/Business doesn't lose them.
  const [savedNames, setSavedNames] = useState({ individual: "", business: "" });
  const business = form.defendantType === "business";

  const clear = (...keys: string[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const matches =
    business && form.defendantLegalName.trim().length >= 2 && !form.defendantExistingBusinessId
      ? BUSINESSES.filter((b) => b.name.toLowerCase().includes(form.defendantLegalName.trim().toLowerCase())).map(
          (b) => ({ id: b.id, label: b.name, hint: `${b.address.city}, ${b.address.state}` }),
        )
      : [];

  function switchType(type: "individual" | "business") {
    if (type === form.defendantType) return;
    const saved = { ...savedNames, [form.defendantType]: form.defendantLegalName };
    setSavedNames(saved);
    update({
      defendantType: type,
      defendantExistingBusinessId: null,
      defendantLegalName: saved[type],
      defendantRegisteredAgent: "",
    });
    clear("defendantLegalName");
  }

  function handleContinue() {
    const errs = strict ? validateDefendant(form) : {};
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Defendant information</h1>
      <p className="text-gray-500 text-sm mb-8">Who are you filing the claim against?</p>

      <div role="radiogroup" aria-label="Defendant type" className="grid grid-cols-2 gap-3 mb-6">
        {TYPES.map((t) => {
          const on = form.defendantType === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => switchType(t.value)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors",
                on ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300",
              )}
            >
              <t.icon className={cn("h-5 w-5 mt-0.5 shrink-0", on ? "text-brand-600" : "text-gray-500")} aria-hidden="true" />
              <div>
                <p className={cn("font-medium text-sm", on ? "text-brand-700" : "text-gray-700")}>{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {business ? (
          <Combobox
            label="Legal name of the business you're suing"
            value={form.defendantLegalName}
            onInputChange={(text) => {
              update({ defendantLegalName: text, defendantExistingBusinessId: null });
              clear("defendantLegalName");
            }}
            options={matches}
            selected={!!form.defendantExistingBusinessId}
            placeholder="XYZ Contractors LLC"
            hint="Enter the business's legal name, including LLC, Inc., Corp., etc., if applicable. Known businesses are suggested as you type."
            error={errors.defendantLegalName}
            onSelect={(o) => {
              const biz = BUSINESSES.find((b) => b.id === o.id);
              if (!biz) return;
              update({
                defendantLegalName: biz.name,
                defendantExistingBusinessId: biz.id,
                defendantCountry: "US",
                defendantAddress: biz.address.line1,
                defendantCity: biz.address.city,
                defendantState: biz.address.state,
                defendantZip: biz.address.zip,
              });
              clear("defendantLegalName", "defendantAddress", "defendantCity", "defendantState", "defendantZip");
            }}
          />
        ) : (
          <TextField
            label="Full legal name of the person you're suing"
            value={form.defendantLegalName}
            placeholder="John Smith"
            hint="Enter their full legal name. This person will be listed as the defendant on your claim."
            error={errors.defendantLegalName}
            onChange={(e) => {
              update({ defendantLegalName: e.target.value });
              clear("defendantLegalName");
            }}
          />
        )}

        {business && (
          <TextField
            label="Registered agent name (optional)"
            value={form.defendantRegisteredAgent}
            placeholder="Jane Doe"
            hint="Required for service in some states"
            onChange={(e) => update({ defendantRegisteredAgent: e.target.value })}
          />
        )}

        {form.defendantExistingBusinessId ? (
          <div className="pt-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">Address on file</p>
            <p>
              {form.defendantAddress}, {form.defendantCity}, {form.defendantState} {form.defendantZip}
            </p>
            <button
              type="button"
              onClick={() => update({ defendantExistingBusinessId: null })}
              className="text-xs text-brand-700 hover:underline mt-2 font-medium"
            >
              Use a different address
            </button>
          </div>
        ) : (
          <div className="pt-1">
            <p className="text-sm font-medium text-gray-700 mb-3">Address</p>
            <AddressFields
              value={{
                country: form.defendantCountry,
                address: form.defendantAddress,
                city: form.defendantCity,
                state: form.defendantState,
                zip: form.defendantZip,
              }}
              errors={{
                country: errors.defendantCountry,
                address: errors.defendantAddress,
                city: errors.defendantCity,
                state: errors.defendantState,
                zip: errors.defendantZip,
              }}
              placeholders={{ address: "456 Oak Ave", city: "Los Angeles", zip: "90002" }}
              onChange={(p) => {
                const patch: Partial<IntakeFormData> = {};
                if (p.country !== undefined) patch.defendantCountry = p.country;
                if (p.address !== undefined) patch.defendantAddress = p.address;
                if (p.city !== undefined) patch.defendantCity = p.city;
                if (p.state !== undefined) patch.defendantState = p.state;
                if (p.zip !== undefined) patch.defendantZip = p.zip;
                update(patch);
                clear(...Object.keys(p).map((k) => `defendant${k[0]!.toUpperCase()}${k.slice(1)}`));
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <TextField
            label="Email (optional)"
            type="email"
            value={form.defendantEmail}
            placeholder="defendant@example.com"
            error={errors.defendantEmail}
            onChange={(e) => {
              update({ defendantEmail: e.target.value });
              clear("defendantEmail");
            }}
          />
          <TextField
            label="Phone (optional)"
            type="tel"
            value={form.defendantPhone}
            placeholder="(555) 555-0100"
            error={errors.defendantPhone}
            onChange={(e) => {
              update({ defendantPhone: e.target.value });
              clear("defendantPhone");
            }}
          />
        </div>
      </div>

      <StepActions hasErrors={Object.keys(errors).length > 0} onBack={onBack} onNext={handleContinue} busy={saving} />
    </div>
  );
}
