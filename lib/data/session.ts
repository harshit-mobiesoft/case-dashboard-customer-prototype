// Prototype "login": a single flag in localStorage. The real app uses magic-link auth
// (JWT cookies); the prototype only needs to model signed-in vs signed-out.

import { useSyncExternalStore } from "react";

export const SESSION_KEY = "cdcp:session:v1";

export type SessionState = "unknown" | "signed_in" | "signed_out";

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function read(): SessionState {
  try {
    return window.localStorage.getItem(SESSION_KEY) === "1" ? "signed_in" : "signed_out";
  } catch {
    return "signed_out";
  }
}

export function signIn(): void {
  try {
    window.localStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage blocked: fall through; the in-memory fallback below keeps this tab signed in.
    memoryFallback = true;
  }
  emit();
}

// Set when the user deliberately signs out, so the route guard sends them to the plain home page
// instead of treating it like a deep link they were turned away from (`/?next=…`).
let deliberateSignOut = false;

export function consumeDeliberateSignOut(): boolean {
  const was = deliberateSignOut;
  deliberateSignOut = false;
  return was;
}

export function signOut(): void {
  deliberateSignOut = true;
  memoryFallback = false;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  emit();
}

let memoryFallback = false;

function getSnapshot(): SessionState {
  const stored = read();
  return stored === "signed_in" || memoryFallback ? "signed_in" : "signed_out";
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** "unknown" on the server and first client render, so SSR markup is identical. */
export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSnapshot, () => "unknown");
}

/** Only same-site relative paths may be used as a post-login redirect (no open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
