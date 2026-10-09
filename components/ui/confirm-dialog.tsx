"use client";

import { Button } from "./button";
import { Dialog } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  variant = "primary",
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !loading && onCancel()}
      title={title}
      description={description}
      hideClose
    >
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button size="sm" variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
