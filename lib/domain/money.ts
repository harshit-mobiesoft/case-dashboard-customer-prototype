/**
 * Parses a user-typed USD amount ("12", "12.5", "$1,250.00") into integer cents.
 * Returns null for blank input and "invalid" for anything else that isn't a money amount.
 */
export function parseUsdToCents(input: string): number | null | "invalid" {
  const cleaned = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return "invalid";
  const cents = Math.round(Number(cleaned) * 100);
  return Number.isSafeInteger(cents) ? cents : "invalid";
}
