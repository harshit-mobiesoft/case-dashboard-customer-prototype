"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CheckboxField, TextField } from "@/components/ui/field";
import { signatureMatches } from "@/lib/domain/transitions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legalName: string;
  pending: boolean;
  error: string | null;
  onSign: (typedName: string) => void;
}

export function SignDialog({ open, onOpenChange, legalName, pending, error, onSign }: Props) {
  // Prototype: pre-filled and pre-agreed, so signing is one click. Still editable, and still checked.
  const [name, setName] = useState(legalName);
  const [agree, setAgree] = useState(true);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (open) {
      setName(legalName);
      setAgree(true);
      setAttempted(false);
    }
  }, [open, legalName]);

  const nameOk = signatureMatches(name, legalName);
  const nameError = attempted && !nameOk ? `Type your full legal name exactly as shown: ${legalName}` : null;
  const agreeError = attempted && !agree ? "You need to agree to sign electronically." : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (nameOk && agree) onSign(name);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
      title="Sign your demand letter"
      description="This is a prototype e-signature. In the real app this step opens our e-signature provider."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          label="Type your full legal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          placeholder={legalName}
          hint={`Must match: ${legalName}`}
          error={nameError}
          required
        />
        <CheckboxField
          label="I agree that typing my name is the legal equivalent of my handwritten signature on this letter."
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          error={agreeError}
        />
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {pending ? "Signing…" : "Sign letter"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
