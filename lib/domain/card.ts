// Fake-checkout card validation for the prototype. No real card ever leaves the browser —
// and none should be typed here: use the published Stripe-style test numbers.

export const TEST_CARD_OK = "4242424242424242";
export const TEST_CARD_DECLINED = "4000000000000002";

export function luhnValid(number: string): boolean {
  const d = number.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export interface CardInput {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
  zip: string;
}

export function validateCard(c: CardInput, now: Date): Partial<Record<keyof CardInput, string>> {
  const e: Partial<Record<keyof CardInput, string>> = {};
  if (!luhnValid(c.number)) e.number = "Enter a valid card number.";

  const m = /^(\d{2})\/(\d{2})$/.exec(c.expiry);
  if (!m) e.expiry = "Use MM/YY.";
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) e.expiry = "Enter a valid month.";
    else if (new Date(year, month, 1).getTime() <= now.getTime()) e.expiry = "This card has expired.";
  }

  if (!/^\d{3,4}$/.test(c.cvc)) e.cvc = "Enter the 3 or 4 digit code.";
  if (!c.name.trim()) e.name = "Name on card is required.";
  if (!/^\d{5}$/.test(c.zip.trim())) e.zip = "Enter a 5-digit ZIP code.";
  return e;
}
