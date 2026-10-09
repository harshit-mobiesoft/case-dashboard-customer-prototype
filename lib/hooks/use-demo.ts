"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { demoStore } from "../data/store";
import type { CaseRecord, DemoState } from "../domain/types";

/** Demo state, or null before the client has hydrated it from storage. */
export function useDemoState(): DemoState | null {
  return useSyncExternalStore(demoStore.subscribe, demoStore.getSnapshot, () => null);
}

export type CaseLookup =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "ready"; case: CaseRecord; profile: DemoState["profile"] };

export function useCase(caseId: string): CaseLookup {
  const state = useDemoState();
  return useMemo<CaseLookup>(() => {
    if (!state) return { status: "loading" };
    const found = state.cases.find((c) => c.id === caseId);
    return found
      ? { status: "ready", case: found, profile: state.profile }
      : { status: "not_found" };
  }, [state, caseId]);
}

/**
 * The current time, null on the server / first client render (keeps SSR deterministic),
 * then refreshed every `intervalMs` so countdowns stay honest on a long-open tab.
 */
export function useNow(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export interface AsyncAction<Args extends unknown[], R> {
  run: (...args: Args) => Promise<R | undefined>;
  pending: boolean;
  error: string | null;
  clearError: () => void;
}

/** Wraps a repository call with pending + error state; never throws into event handlers. */
export function useAsyncAction<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  onError?: (message: string) => void,
): AsyncAction<Args, R> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always call the latest fn/onError without making `run` change identity every render.
  const latest = useRef({ fn, onError });
  latest.current = { fn, onError };

  const run = useCallback(async (...args: Args) => {
    setPending(true);
    setError(null);
    try {
      return await latest.current.fn(...args);
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
      setError(message);
      latest.current.onError?.(message);
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  return { run, pending, error, clearError };
}

/**
 * Optimistic UI for toggles: show the user's choice immediately, then fall back to the
 * real value once the request settles (so a failed request visibly reverts).
 */
export function useOptimisticValue<T>(serverValue: T) {
  const [override, setOverride] = useState<{ value: T } | null>(null);
  return {
    value: override ? override.value : serverValue,
    begin: (value: T) => setOverride({ value }),
    settle: () => setOverride(null),
  };
}
