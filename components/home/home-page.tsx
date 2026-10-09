"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { repository } from "@/lib/data/repository";
import { safeNextPath, signIn } from "@/lib/data/session";
import { routes } from "@/lib/domain/routes";
import { useDemoState, useStrict } from "@/lib/hooks/use-demo";

export function HomePage() {
  const router = useRouter();
  const demo = useDemoState();
  const strict = useStrict();

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill with the demo customer's email so the walkthrough is one click.
  useEffect(() => {
    if (!touched && demo) setEmail(demo.profile.email);
  }, [demo, touched]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await repository.requestSignIn(email);
      signIn();
      const next = safeNextPath(new URLSearchParams(window.location.search).get("next"), routes.dashboard);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white min-h-[calc(100vh-6rem)]">
      {/* ── Hero ── */}
      <main id="main" className="relative pt-12 sm:pt-24 pb-16 px-4 sm:px-6 overflow-x-hidden min-h-[inherit]">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/70 via-white/60 to-white pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -right-24 w-80 h-80 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex justify-center">
            <div className="w-full max-w-sm sm:max-w-md">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm sm:max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Enter your email to open your case dashboard.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1">
                    <label htmlFor="home-email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="home-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setTouched(true);
                        setEmail(e.target.value);
                      }}
                      placeholder="you@example.com"
                      aria-invalid={!!error || undefined}
                      aria-describedby={error ? "home-email-error" : "home-email-hint"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-500"
                    />
                    <p id="home-email-hint" className="text-xs text-gray-500">
                      Prototype: pre-filled with the demo customer — no password or email link needed.
                    </p>
                  </div>
                  {error && (
                    <p id="home-email-error" role="alert" className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading || (strict && !email.trim())}
                    className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
                    {loading ? "Signing you in…" : "Sign in to my dashboard"}
                  </button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-5">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-brand-600 font-medium hover:underline transition-colors">
                    Sign up
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
          </div>
        </div>
      </main>
    </div>
  );
}
