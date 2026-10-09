"use client";

import { CheckCircle2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntakeFormData } from "@/lib/domain/intake";
import { computeQuote } from "@/lib/domain/pricing";
import { MAILING_METHOD_LABELS } from "@/lib/domain/labels";
import { formatCurrency } from "@/lib/format";


interface Props {
  form: IntakeFormData;
  onBack: () => void;
  onSubmit: () => void;
  /** Jump to the internal step that owns a section (1, 2 or 4). */
  onEditStep: (step: number) => void;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 sm:text-right break-words">{value}</dd>
    </div>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl overflow-hidden" aria-label={title}>
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <button type="button" onClick={onEdit} aria-label={`Edit ${title}`} className="text-xs text-brand-700 flex items-center gap-1 hover:underline">
          <Edit2 className="h-3 w-3" aria-hidden="true" /> Edit
        </button>
      </div>
      <dl className="px-5">{children}</dl>
    </section>
  );
}

const WHAT_NEXT = [
  "You will receive a link to your case dashboard, and be asked a few questions to help craft your letter.",
  "Most cases are fully handled through our automated service with a clerical and technical review within 2-3 business days.*",
  "Our dashboard wizard will guide you through organizing your case and supporting documents.",
  "You will be able to review your letter and e-sign it through your dashboard.",
  "We send it via postal mail to the defendant.",
  "Free Bonus: Our Court Filing Manager** is included at no extra cost to help you if your case remains unresolved.",
];

export function StepReview({ form, onBack, onSubmit, onEditStep }: Props) {
  const ah = form.service === "activation_hero";
  const q = computeQuote(form.mailingPref);
  const certified = form.mailingPref === "certified";
  const mailingLabel = MAILING_METHOD_LABELS[form.mailingPref ?? "first_class"];
  const addr = (a: string, c: string, s: string, z: string, country: string) =>
    [a, c, s, z, country && country.toUpperCase() !== "US" ? country.toUpperCase() : null].filter(Boolean).join(", ");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Review your claim</h1>
      <p className="text-gray-500 text-sm mb-8">Please verify the details before proceeding to payment.</p>

      <div className="space-y-4">
        <Section title="Your information" onEdit={() => onEditStep(1)}>
          <Row label="Name" value={form.claimantName} />
          <Row label="Email" value={form.claimantEmail} />
          <Row label="Phone" value={form.claimantPhone} />
          <Row label="Address" value={addr(form.claimantAddress, form.claimantCity, form.claimantState, form.claimantZip, form.claimantCountry)} />
        </Section>

        <Section title="Defendant" onEdit={() => onEditStep(2)}>
          {ah ? (
            <>
              <Row label="Platform" value={form.platformName} />
              <Row label="Account email" value={form.platformAccountEmail} />
              <Row label="Account phone" value={form.platformAccountPhone} />
            </>
          ) : (
            <>
              <Row label="Type" value={form.defendantType === "business" ? "Business" : "Individual"} />
              <Row label="Legal name" value={form.defendantLegalName} />
              <Row label="Registered agent" value={form.defendantRegisteredAgent} />
              <Row label="Address" value={addr(form.defendantAddress, form.defendantCity, form.defendantState, form.defendantZip, form.defendantCountry)} />
            </>
          )}
        </Section>

        <Section title="Claim details" onEdit={() => onEditStep(4)}>
          <Row label="Category" value={form.claimCategories.join(", ") || "—"} />
          <Row label={ah ? "Date of deactivation" : "Incident date"} value={form.incidentDate} />
          <Row label={ah ? "Estimated lost earnings" : "Amount claimed"} value={form.claimAmount ? formatCurrency(Number(form.claimAmount)) : null} />
          <Row label="Filing county" value={form.countyName || "Not selected"} />
          <Row label="Mailing method" value={mailingLabel} />
        </Section>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Claim description</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{form.claimDescription}</p>
        </div>

        <section aria-label="Order preview" className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Order preview</h2>
          </div>
          <div className="px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Demand letter preparation</span>
              <span className="text-gray-900 font-medium">{formatCurrency(q.baseCents / 100)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{mailingLabel}</span>
              <span className="text-gray-900 font-medium">{certified ? formatCurrency(q.certifiedCents / 100) : "Included"}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCurrency(q.totalCents / 100)}</span>
            </div>
            <p className="text-xs text-gray-500 pt-1">Final amount (and any coupon) shown at checkout.</p>
          </div>
        </section>
      </div>

      <div className="mt-6 p-4 bg-brand-50 border border-brand-100 rounded-xl">
        <p className="text-sm font-semibold text-brand-800 mb-2">What happens after payment</p>
        <ul className="space-y-1.5">
          {WHAT_NEXT.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-brand-700">
              <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" aria-hidden="true" />
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-3.5 pt-3.5 border-t border-brand-100 space-y-2">
          <p className="text-xs text-brand-700 leading-relaxed">
            *If our automated service cannot fully assist with your case, or if our platform identifies that an
            additional review may be beneficial, your case details and contact information are shared with
            participating legal professionals (including attorneys and paralegals) for potential review or an offer of
            representation (see our terms). Sharing this information does not guarantee a review, does not form an
            attorney-client relationship, and any further services would be billed separately by that professional.
          </p>
          <p className="text-xs text-brand-700 leading-relaxed">
            **Court Filing Manager is our complimentary gift to help guide you towards a successful outcome if the
            defendant ignores your letter. Your payment today goes entirely toward creating and mailing your automated
            demand letter. Because this guided manager is a 100% free bonus feature, it is always included for your
            peace of mind and carries no separate cash or refund value.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={onBack} className="flex-1 sm:flex-none">
          Back
        </Button>
        <Button size="lg" onClick={onSubmit} className="flex-1 sm:flex-none sm:ml-auto">
          Continue to payment →
        </Button>
      </div>
    </div>
  );
}
