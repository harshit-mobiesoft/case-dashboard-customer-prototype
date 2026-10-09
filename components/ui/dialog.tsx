"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Hide the corner close button (use for forced-choice dialogs). */
  hideClose?: boolean;
}

/** Accessible modal: focus trap, ESC to close, scroll lock, labelled by its title. */
export function Dialog({ open, onOpenChange, title, description, children, className, hideClose }: DialogProps) {
  // Our dialogs are opened from state, not <Dialog.Trigger>, and Radix only restores focus to a
  // Trigger. So remember whatever had focus when the dialog opened and give it back on close.
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 animate-fade-in" />
        <RadixDialog.Content
          className={cn(
            "fixed inset-0 z-50 m-auto h-fit w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl animate-slide-up",
            className,
          )}
          onOpenAutoFocus={() => {
            openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const opener = openerRef.current;
            openerRef.current = null;
            if (opener?.isConnected) opener.focus();
          }}
        >
          <RadixDialog.Title className="font-semibold text-gray-900">{title}</RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className="text-sm text-gray-600 mt-1.5">
              {description}
            </RadixDialog.Description>
          ) : (
            <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
          )}
          <div className="mt-4">{children}</div>
          {!hideClose && (
            <RadixDialog.Close
              className="absolute right-3 top-3 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </RadixDialog.Close>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
