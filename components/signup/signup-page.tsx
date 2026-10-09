"use client";

import { CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "@/lib/data/session";
import { useStrict } from "@/lib/hooks/use-demo";
import { routes } from "@/lib/domain/routes";
import { isValidEmail } from "@/lib/domain/intake-validation";

function SignupForm() {
  const router = useRouter();
  const strict = useStrict();
  const params = useSearchParams();
  const emailFromUrl = params.get("email") ?? "";
  const justPaid = params.get("paid") === "1";
  const caseId = params.get("case");

  const [email, setEmail] = useState(emailFromUrl);
  const [stage, setStage] = useState<"form" | "sent">("form");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (strict && !isValidEmail(email)) return setError("Enter a valid email address.");
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setLoading(false);
    setStage("sent");
  }

  function openMagicLink() {
    signIn();
    router.push(caseId ? routes.case(caseId) : routes.dashboard);
  }

  if (stage === "sent") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm sm:max-w-md text-center space-y-4" role="status" aria-live="polite">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="h-7 w-7 text-green-700" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
          {justPaid && <p className="text-sm font-medium text-green-800">Payment confirmed. Your case has been created.</p>}
          <p className="text-sm text-gray-500">
            We just sent you your account activation link to your email.
            <span className="block mt-1 font-medium text-gray-700 break-all">{email}</span>
          </p>
          <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-3 text-left">
            <p className="text-xs text-brand-800 mb-2">
              <strong>Prototype:</strong> no email is sent. Click below to open the link as if you had.
            </p>
            <button
              type="button"
              onClick={openMagicLink}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors"
            >
              Open my magic link
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Wrong email?{" "}
            <Link href="/support" className="text-brand-700 hover:underline">
              Contact support
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email — we&apos;ll send you a setup link.</p>
        </div>

        {justPaid && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-green-900">Payment confirmed</p>
              <p className="text-xs text-green-800">Your case has been created. We&apos;ll email you a link to access it.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!!emailFromUrl}
              placeholder="you@example.com"
              aria-invalid={!!error || undefined}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-500 read-only:bg-gray-50 read-only:text-gray-600 read-only:cursor-not-allowed"
            />
            {emailFromUrl && <p className="text-xs text-gray-500">Filled from your intake form</p>}
          </div>
          {error && (
            <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || (strict && !email.trim())}
            className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
            {loading ? "Sending…" : "Send account setup link"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link href="/" className="text-brand-600 font-medium hover:underline transition-colors">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-gray-500 mt-2">
          Or start a new claim:{" "}
          <Link href="/smallclaimshero" className="text-brand-700 hover:underline transition-colors">
            Small Claims
          </Link>
          {" / "}
          <Link href="/activationhero" className="text-brand-700 hover:underline transition-colors">
            Activation Hero
          </Link>
        </p>
      </div>
    </div>
  );
}

export function SignupPage() {
  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-white min-h-[70vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50/70 via-white/60 to-white pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 -right-24 w-80 h-80 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />
      <main id="main" className="relative flex-1 flex flex-col">
        <Suspense>
          <SignupForm />
        </Suspense>
      </main>
    </div>
  );
}
