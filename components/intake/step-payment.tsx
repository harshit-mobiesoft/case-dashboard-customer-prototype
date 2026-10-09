"use client";

import { CheckCircle2, CreditCard, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { CheckboxField, TextField } from "@/components/ui/field";
import { repository } from "@/lib/data/repository";
import { useSession } from "@/lib/data/session";
import {
  TEST_CARD_DECLINED,
  TEST_CARD_OK,
  formatCardNumber,
  formatExpiry,
  validateCard,
  type CardInput,
} from "@/lib/domain/card";
import type { IntakeFormData } from "@/lib/domain/intake";
import { MAILING_METHOD_LABELS } from "@/lib/domain/labels";
import { COUPONS, computeQuote, isValidCoupon, normalizeCoupon } from "@/lib/domain/pricing";
import { routes } from "@/lib/domain/routes";
import type { CaseRecord } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { useAsyncAction } from "@/lib/hooks/use-demo";
import { cn } from "@/lib/utils";

interface Props {
  form: IntakeFormData;
  draftId: string | null;
  onBack: () => void;
  /** Validate the card and terms before paying; off by default (the card is pre-filled instead). */
  strict?: boolean;
}

const EMPTY_CARD: CardInput = { number: "", expiry: "", cvc: "", name: "", zip: "" };

export function StepPayment({ form, draftId, onBack, strict }: Props) {
  const session = useSession();
  const [card, setCard] = useState<CardInput>({
    ...EMPTY_CARD,
    name: form.claimantName,
    zip: form.claimantZip.slice(0, 5),
    ...(strict ? {} : { number: formatCardNumber(TEST_CARD_OK), expiry: "12/30", cvc: "123" }),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CardInput | "terms", string>>>({});
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(!strict);
  const [created, setCreated] = useState<CaseRecord | null>(null);

  const quote = computeQuote(form.mailingPref, appliedCoupon);
  const pay = useAsyncAction(() => repository.submitIntake({ form, draftId, cardNumber: card.number }));

  function applyCoupon() {
    if (!coupon.trim()) return;
    if (isValidCoupon(coupon)) {
      setAppliedCoupon(normalizeCoupon(coupon));
      setCouponError(null);
    } else {
      setAppliedCoupon(null);
      setCouponError("That coupon code isn't valid.");
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = strict ? validateCard(card, new Date()) : {};
    if (strict && !agreed) errs.terms = "Please agree to the terms to continue.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const result = await pay.run();
    if (result) setCreated(result);
  }

  const set = (k: keyof CardInput, v: string) => {
    setCard((c) => ({ ...c, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  if (created) {
    const signedIn = session === "signed_in";
    return (
      <div className="max-w-xl mx-auto text-center py-6" role="status">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-700" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment received</h1>
        <p className="text-gray-600 mb-1">
          Your case <span className="font-mono font-medium">#{created.referenceCode}</span> has been created.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          {signedIn
            ? "Head to your dashboard to track it — we'll guide you through each next step."
            : `Next, set up your account — we'll email a sign-in link to ${form.claimantEmail}.`}
        </p>
        {signedIn ? (
          <Link href={routes.case(created.id)} className={buttonVariants({ size: "lg" })}>
            Go to my case
          </Link>
        ) : (
          <Link
            href={`/signup?email=${encodeURIComponent(form.claimantEmail)}&paid=1&service=${form.service}&case=${created.id}`}
            className={buttonVariants({ size: "lg" })}
          >
            Set up my account
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment</h1>
      <p className="text-gray-500 text-sm mb-8">Secure checkout — one flat fee, no hourly billing.</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={handlePay} noValidate className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4" aria-label="Payment details">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Card details
          </div>

          <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2.5 text-xs text-brand-800">
            <p className="font-semibold mb-1">Prototype checkout — no real payment</p>
            <p>
              Use test card{" "}
              <button type="button" className="font-mono underline" onClick={() => set("number", formatCardNumber(TEST_CARD_OK))}>
                4242 4242 4242 4242
              </button>{" "}
              (approved) or{" "}
              <button type="button" className="font-mono underline" onClick={() => set("number", formatCardNumber(TEST_CARD_DECLINED))}>
                4000 0000 0000 0002
              </button>{" "}
              (declined), any future expiry and any 3-digit code.
            </p>
          </div>

          <TextField
            label="Card number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 1234 1234 1234"
            value={card.number}
            error={errors.number}
            onChange={(e) => set("number", formatCardNumber(e.target.value))}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry} error={errors.expiry} onChange={(e) => set("expiry", formatExpiry(e.target.value))} />
            <TextField label="CVC" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} value={card.cvc} error={errors.cvc} onChange={(e) => set("cvc", e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextField label="Name on card" autoComplete="cc-name" value={card.name} error={errors.name} fieldClassName="sm:col-span-2" onChange={(e) => set("name", e.target.value)} />
            <TextField label="Billing ZIP" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={card.zip} error={errors.zip} onChange={(e) => set("zip", e.target.value.replace(/\D/g, ""))} />
          </div>

          <CheckboxField
            checked={agreed}
            error={errors.terms}
            onChange={(e) => {
              setAgreed(e.target.checked);
              setErrors((p) => ({ ...p, terms: undefined }));
            }}
            label={
              <>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
                  Terms of Use
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
                  Privacy Policy
                </a>
                .
              </>
            }
          />

          {pay.error && (
            <Alert tone="error">
              {pay.error}
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onBack} disabled={pay.pending}>
              Back
            </Button>
            <Button type="submit" size="lg" loading={pay.pending} className="flex-1 sm:flex-none sm:ml-auto">
              <Lock className="h-4 w-4" aria-hidden="true" />
              {pay.pending ? "Processing…" : `Pay ${formatCurrency(quote.totalCents / 100)}`}
            </Button>
          </div>
        </form>

        <aside aria-label="Order summary" className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700">Order summary</h2>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Demand letter preparation</span>
                <span className="font-medium text-gray-900">{formatCurrency(quote.baseCents / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{MAILING_METHOD_LABELS[form.mailingPref ?? "first_class"]}</span>
                <span className="font-medium text-gray-900">{quote.certifiedCents ? formatCurrency(quote.certifiedCents / 100) : "Included"}</span>
              </div>
              {quote.discountCents > 0 && (
                <div className="flex justify-between text-green-800">
                  <span>Coupon ({quote.couponLabel})</span>
                  <span>-{formatCurrency(quote.discountCents / 100)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-100">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(quote.totalCents / 100)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-1.5">
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
                placeholder="HERO10"
                aria-invalid={!!couponError || undefined}
                aria-describedby="coupon-msg"
                className={cn("flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm placeholder:text-gray-500", couponError ? "border-red-400 bg-red-50" : "border-gray-300")}
              />
              <Button variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
            <p id="coupon-msg" className={cn("text-xs mt-1.5", couponError ? "text-red-700" : appliedCoupon ? "text-green-800" : "text-gray-500")} role={couponError ? "alert" : undefined}>
              {couponError ?? (appliedCoupon ? `${appliedCoupon} applied — ${COUPONS[appliedCoupon]?.label}.` : "Try HERO10 for 10% off.")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

