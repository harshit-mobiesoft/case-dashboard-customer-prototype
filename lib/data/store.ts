// Tiny external store (useSyncExternalStore-compatible) persisted to localStorage.
//
// - SSR/first paint: `getSnapshot()` is null until `init()` runs on the client, so server
//   and client render the same loading UI (no hydration mismatches).
// - Persistence is versioned + validated; corrupt or outdated data falls back to the seed.
// - All storage access is try/catch-guarded (private mode, quota, blocked storage).

import type { DemoState } from "../domain/types";
import { buildSeed, SEED_VERSION } from "./seed";

export const STORAGE_KEY = `cdcp:state:v${SEED_VERSION}`;

type Listener = () => void;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function isDemoState(value: unknown): value is DemoState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<DemoState>;
  return (
    v.version === 1 &&
    typeof v.seededAt === "string" &&
    typeof v.profile === "object" &&
    v.profile !== null &&
    Array.isArray(v.cases) &&
    v.cases.every(
      (c) => typeof c === "object" && c !== null && typeof (c as { id?: unknown }).id === "string",
    ) &&
    Array.isArray(v.drafts)
  );
}

export interface DemoStore {
  init(): void;
  getSnapshot(): DemoState | null;
  subscribe(listener: Listener): () => void;
  /** Apply a pure update and persist it. */
  update(updater: (state: DemoState) => DemoState): DemoState;
  reset(): DemoState;
  /** Re-read persisted state (another tab changed it). */
  reload(): void;
}

export function createDemoStore(options: {
  storage?: KeyValueStorage | null;
  now?: () => Date;
}): DemoStore {
  const now = options.now ?? (() => new Date());
  let state: DemoState | null = null;
  const listeners = new Set<Listener>();

  const emit = () => listeners.forEach((l) => l());

  function read(): DemoState | null {
    try {
      const raw = options.storage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isDemoState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function write(next: DemoState) {
    try {
      options.storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full/blocked: the demo keeps working in-memory for this tab.
    }
  }

  return {
    init() {
      if (state) return;
      // Drop copies saved under older seed versions.
      for (let v = 1; v < SEED_VERSION; v++) {
        try {
          options.storage?.removeItem(`cdcp:state:v${v}`);
        } catch {
          // ignore
        }
      }
      state = read() ?? buildSeed(now());
      write(state);
      emit();
    },
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(updater) {
      if (!state) state = read() ?? buildSeed(now());
      state = updater(state);
      write(state);
      emit();
      return state;
    },
    reset() {
      state = buildSeed(now());
      write(state);
      emit();
      return state;
    },
    reload() {
      const persisted = read();
      if (persisted) {
        state = persisted;
        emit();
      }
    },
  };
}

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const demoStore: DemoStore = createDemoStore({ storage: browserStorage() });
