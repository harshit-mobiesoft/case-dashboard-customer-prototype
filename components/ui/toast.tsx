"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastApi {
  toast: (t: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback<ToastApi["toast"]>(({ title, description, variant = "success" }) => {
    setItems((prev) => [...prev, { id: nextId++, title, description, variant }]);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((item) => (
          <RadixToast.Root
            key={item.id}
            onOpenChange={(open) => !open && setItems((prev) => prev.filter((i) => i.id !== item.id))}
            className={cn(
              "flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg animate-slide-up",
              item.variant === "error" ? "border-red-200" : "border-green-200",
            )}
          >
            {item.variant === "error" ? (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              <RadixToast.Title className="text-sm font-semibold text-gray-900">{item.title}</RadixToast.Title>
              {item.description && (
                <RadixToast.Description className="text-sm text-gray-600 mt-0.5">
                  {item.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close aria-label="Dismiss notification" className="rounded p-0.5 text-gray-500 hover:bg-gray-100">
              <X className="h-4 w-4" aria-hidden="true" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
