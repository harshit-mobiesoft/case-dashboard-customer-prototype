import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { demoStore } from "@/lib/data/store";
import type { CaseRecord } from "@/lib/domain/types";

export const push = (globalThis as unknown as { __routerPush: ReturnType<typeof vi.fn> }).__routerPush;

export function renderUi(ui: React.ReactElement, options?: RenderOptions) {
  return render(<ToastProvider>{ui}</ToastProvider>, options);
}

/** Fresh seeded store for tests that talk to the real repository. */
export function freshStore() {
  window.localStorage.clear();
  demoStore.reset();
  return demoStore;
}

export function storedCase(id: string): CaseRecord {
  const found = demoStore.getSnapshot()?.cases.find((c) => c.id === id);
  if (!found) throw new Error(`no case ${id}`);
  return found;
}
