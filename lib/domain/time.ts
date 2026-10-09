export const DAY_MS = 24 * 60 * 60 * 1000;

/** Length of the defendant's response window after the letter is mailed. */
export const RESPONSE_WINDOW_DAYS = 21;

/** "Urgent" styling kicks in when this many days (or fewer) remain. */
export const URGENT_DAYS = 3;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function isExpired(deadlineIso: string, now: Date): boolean {
  return new Date(deadlineIso).getTime() <= now.getTime();
}

/** Whole days left, rounded up so "23 hours left" reads as "1 day", never "0 days" while still open. */
export function daysRemaining(deadlineIso: string, now: Date): number {
  const ms = new Date(deadlineIso).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / DAY_MS);
}

/** Percentage (0–100) of the window that has elapsed. */
export function windowElapsedPercent(sentAtIso: string, deadlineIso: string, now: Date): number {
  const start = new Date(sentAtIso).getTime();
  const end = new Date(deadlineIso).getTime();
  if (end <= start) return 100;
  const pct = ((now.getTime() - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, pct));
}
