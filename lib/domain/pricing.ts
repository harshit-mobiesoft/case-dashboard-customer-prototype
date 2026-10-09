import type { MailingMethod } from "./types";

// Keep in sync with the production defaults (lib/pricing-defaults.ts in casedashboard).
export const DEMAND_LETTER_PRICE_CENTS = 6900;
export const CERTIFIED_MAIL_UPSELL_CENTS = 2000;

/** Prototype coupons: percent off the order total. */
export const COUPONS: Record<string, { percentOff: number; label: string }> = {
  HERO10: { percentOff: 10, label: "10% off" },
  HERO25: { percentOff: 25, label: "25% off" },
};

export interface Quote {
  baseCents: number;
  certifiedCents: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  couponLabel: string | null;
}

export function normalizeCoupon(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidCoupon(code: string): boolean {
  return normalizeCoupon(code) in COUPONS;
}

export function computeQuote(mailing: MailingMethod | null, couponCode?: string | null): Quote {
  const certifiedCents = mailing === "certified" ? CERTIFIED_MAIL_UPSELL_CENTS : 0;
  const subtotalCents = DEMAND_LETTER_PRICE_CENTS + certifiedCents;
  const coupon = couponCode ? COUPONS[normalizeCoupon(couponCode)] : undefined;
  const discountCents = coupon ? Math.round((subtotalCents * coupon.percentOff) / 100) : 0;
  return {
    baseCents: DEMAND_LETTER_PRICE_CENTS,
    certifiedCents,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    couponLabel: coupon ? coupon.label : null,
  };
}
