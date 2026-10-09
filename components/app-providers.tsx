"use client";

import { useEffect } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { demoStore, STORAGE_KEY } from "@/lib/data/store";
import { setStrict } from "@/lib/domain/strict";

const STRICT_KEY = "cdcp:strict";

/** `?validate=1` turns validation on for this tab (kept in sessionStorage); `?validate=0` turns it off. */
function initStrictMode() {
  try {
    const param = new URLSearchParams(window.location.search).get("validate");
    if (param === "1") window.sessionStorage.setItem(STRICT_KEY, "1");
    if (param === "0") window.sessionStorage.removeItem(STRICT_KEY);
    setStrict(window.sessionStorage.getItem(STRICT_KEY) === "1");
  } catch {
    setStrict(false);
  }
}

/** Hydrates demo state from storage after mount and keeps multiple tabs in sync. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initStrictMode();
    demoStore.init();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) demoStore.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <ToastProvider>{children}</ToastProvider>;
}
