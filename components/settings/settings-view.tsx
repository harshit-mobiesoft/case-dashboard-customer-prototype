"use client";

import { ChevronLeft, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageSkeleton } from "@/components/layout/case-gate";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { repository } from "@/lib/data/repository";
import { US_STATES, normalizeProfile, validateProfile, type ProfileErrors } from "@/lib/domain/profile";
import { routes } from "@/lib/domain/routes";
import type { Profile } from "@/lib/domain/types";
import { formatPhone } from "@/lib/format";
import { useAsyncAction, useDemoState } from "@/lib/hooks/use-demo";

export function SettingsView() {
  const state = useDemoState();
  if (!state) return <PageSkeleton label="Loading your account" />;
  // Keyed so a demo reset re-initialises the form from the new profile.
  return <SettingsForm key={state.seededAt} profile={state.profile} />;
}

function SettingsForm({ profile }: { profile: Profile }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<Profile>({ ...profile, phone: formatPhone(profile.phone) });
  const [errors, setErrors] = useState<ProfileErrors>({});

  const save = useAsyncAction(
    (p: Profile) => repository.updateProfile(p),
    (m) => toast({ title: "Couldn't save your changes", description: m, variant: "error" }),
  );

  const dirty = useMemo(
    () => JSON.stringify(normalizeProfile(draft)) !== JSON.stringify(normalizeProfile(profile)),
    [draft, profile],
  );

  const set = <K extends "firstName" | "lastName" | "phone">(key: K, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const setAddress = (key: keyof Profile["address"], value: string) => {
    const errKey = key === "line1" ? "line1" : key;
    setDraft((d) => ({ ...d, address: { ...d.address, [key]: value } }));
    setErrors((e) => ({ ...e, [errKey]: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateProfile(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const result = await save.run(normalizeProfile(draft));
    if (result) toast({ title: "Account updated" });
  }

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  return (
    <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link href={routes.dashboard} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors mb-4">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        My cases
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Account settings</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your profile, contact details, and login email.</p>

      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 mb-6">
        <div className="h-12 w-12 rounded-full bg-brand-600 ring-4 ring-brand-50 flex items-center justify-center shrink-0" aria-hidden="true">
          <span className="text-base font-bold text-white">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <SectionCard icon={User} title="Personal information" description="Your name, contact details, and address used for new intake forms.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="First name" value={draft.firstName} onChange={(e) => set("firstName", e.target.value)} error={errors.firstName} autoComplete="given-name" required />
            <TextField label="Last name" value={draft.lastName} onChange={(e) => set("lastName", e.target.value)} error={errors.lastName} autoComplete="family-name" required />
            <TextField label="Phone" type="tel" inputMode="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} autoComplete="tel" required fieldClassName="sm:col-span-2" />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 mt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mailing address</p>
            <TextField label="Street address" value={draft.address.line1} onChange={(e) => setAddress("line1", e.target.value)} error={errors.line1} autoComplete="address-line1" required />
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <TextField label="City" value={draft.address.city} onChange={(e) => setAddress("city", e.target.value)} error={errors.city} autoComplete="address-level2" required fieldClassName="sm:col-span-3" />
              <SelectField
                label="State"
                value={draft.address.state}
                onChange={(e) => setAddress("state", e.target.value)}
                error={errors.state}
                options={[{ value: "", label: "Select…" }, ...US_STATES.map((s) => ({ value: s, label: s }))]}
                autoComplete="address-level1"
                required
                fieldClassName="sm:col-span-1"
              />
              <TextField label="ZIP" inputMode="numeric" value={draft.address.zip} onChange={(e) => setAddress("zip", e.target.value)} error={errors.zip} autoComplete="postal-code" required fieldClassName="sm:col-span-2" />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Mail} title="Login email" description="The address you sign in with and where we send case updates.">
          <TextField label="Email" value={profile.email} readOnly disabled hint="To change your login email, contact support — we'll verify the new address first." />
          <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-600">
            <Lock className="h-3 w-3" aria-hidden="true" /> Read-only in this prototype
          </p>
        </SectionCard>

        {Object.keys(errors).some((k) => errors[k as keyof ProfileErrors]) && <Alert tone="error">Please fix the highlighted fields.</Alert>}

        <div className="flex items-center justify-end gap-3">
          {dirty && <span className="text-sm text-gray-600">You have unsaved changes</span>}
          <Button type="submit" size="lg" disabled={!dirty} loading={save.pending}>
            {save.pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </main>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
        <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
