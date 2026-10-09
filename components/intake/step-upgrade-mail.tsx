"use client";

import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { CERTIFIED_MAIL_UPSELL_CENTS } from "@/lib/domain/pricing";
import { formatCurrency } from "@/lib/format";

export function StepUpgradeMail({ onAdd, onSkip }: { onAdd: () => void; onSkip: () => void }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-7 w-7 text-brand-600" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Upgrade to certified mail?</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          You selected first class mail. We recommend upgrading — certified mail provides tracking and delivery
          confirmation, which strengthens your case if you ever go to court.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border-2 border-brand-500 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <h2 className="font-semibold text-gray-900 text-sm">Certified mail</h2>
            <span className="ml-auto text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">Recommended</span>
          </div>
          <ul className="space-y-2 mb-4">
            {["Tracking number", "Delivery confirmation", "Stronger legal standing", "21-day response window"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-brand-700 mb-4">+{formatCurrency(CERTIFIED_MAIL_UPSELL_CENTS / 100)}</p>
          <button
            type="button"
            onClick={onAdd}
            className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Add certified mail
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-gray-500" aria-hidden="true" />
            <h2 className="font-semibold text-gray-700 text-sm">First class mail</h2>
          </div>
          <ul className="space-y-2 mb-4">
            {["Standard delivery", "No tracking number", "No delivery confirmation", "Less defensible in court"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center" aria-hidden="true">
                  –
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mb-4">Included</p>
          <button
            type="button"
            onClick={onSkip}
            className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Keep first class
          </button>
        </div>
      </div>
    </div>
  );
}
