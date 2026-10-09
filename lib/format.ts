import { format, formatDistance } from "date-fns";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatLongDate(date: string | Date): string {
  return format(new Date(date), "MMMM d, yyyy");
}

/** Relative to an explicit clock so output is deterministic (SSR-safe, testable). */
export function formatRelative(date: string | Date, now: Date): string {
  return formatDistance(new Date(date), now, { addSuffix: true });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}
