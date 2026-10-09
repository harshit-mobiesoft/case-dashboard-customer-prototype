"use client";

import { useEffect } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { demoStore, STORAGE_KEY } from "@/lib/data/store";

/** Hydrates demo state from storage after mount and keeps multiple tabs in sync. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    demoStore.init();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) demoStore.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <ToastProvider>{children}</ToastProvider>;
}
