import { buildSeed } from "@/lib/data/seed";
import type { CaseRecord } from "@/lib/domain/types";

export const NOW = new Date("2026-10-09T12:00:00.000Z");

export const seed = buildSeed(NOW);

export function seedCase(id: string): CaseRecord {
  const found = seed.cases.find((c) => c.id === id);
  if (!found) throw new Error(`no seeded case ${id}`);
  return found;
}

export function later(minutes: number): Date {
  return new Date(NOW.getTime() + minutes * 60_000);
}
