"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "@/lib/data/session";
import { routes } from "@/lib/domain/routes";
import { useDemoState } from "@/lib/hooks/use-demo";

const TAGLINE = (
  <>
    Track &amp; manage your claims for{" "}
    <a href="https://www.activationhero.com" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:underline">
      Activation Hero
    </a>{" "}
    &amp;{" "}
    <a href="https://www.smallclaimshero.com" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:underline">
      Small Claims Hero
    </a>
  </>
);

export function SiteNav() {
  const session = useSession();
  const state = useDemoState();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const loading = session === "unknown";
  const signedIn = session === "signed_in";
  const profile = state?.profile;
  const initials = profile ? `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase() : "";

  // On the intake pages the header carries the service name, as in the production app.
  const serviceLabel =
    pathname === "/activationhero" ? "Activation Hero" : pathname === "/smallclaimshero" ? "Small Claims Hero" : null;

  function handleSignOut() {
    setMobileOpen(false);
    signOut();
    router.push("/");
  }

  return (
    <header className="bg-brand-600 border-b border-brand-700 sticky top-0 z-40">
      <nav
        aria-label="Main"
        className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between sm:h-14 ${serviceLabel ? "py-2 sm:py-0" : "h-14"}`}
      >
        <Link href="/" className="flex items-center gap-2 font-bold text-white shrink-0 hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/heroshield.svg" alt="" className="h-8 w-auto shrink-0" aria-hidden="true" />
          {serviceLabel ? (
            <span className="leading-tight">
              <span className="block sm:inline">{serviceLabel}</span>
              <span className="hidden sm:inline"> | </span>
              <span className="block sm:inline">Case Dashboard</span>
            </span>
          ) : (
            <span>Case Dashboard</span>
          )}
        </Link>

        <div className="hidden sm:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 rounded-lg bg-white/10 animate-pulse" />
          ) : signedIn && profile ? (
            <>
              <Link href={routes.dashboard} className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                My Claims
              </Link>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  aria-label={`Account menu for ${profile.firstName} ${profile.lastName}`}
                  className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                >
                  <span className="h-8 w-8 rounded-full bg-brand-800 flex items-center justify-center text-white text-xs font-semibold">
                    {initials}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 animate-fade-in"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{profile.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Customer</p>
                    </div>
                    <DropdownMenu.Item asChild>
                      <Link
                        href={routes.settings}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 outline-none data-[highlighted]:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4" aria-hidden="true" />
                        Account settings
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={handleSignOut}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 outline-none cursor-pointer data-[highlighted]:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <p className="text-sm text-white/90">{TAGLINE}</p>
          )}
        </div>

        <button
          type="button"
          className="sm:hidden p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors disabled:invisible"
          onClick={() => setMobileOpen((o) => !o)}
          disabled={loading}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>

      {mobileOpen && (
        <div id="mobile-menu" className="sm:hidden absolute top-full inset-x-0 z-20 border-t border-brand-700 bg-brand-600 shadow-lg px-4 py-3 space-y-1">
          {signedIn && profile ? (
            <>
              <div className="px-2 py-2 border-b border-white/10 mb-2">
                <p className="text-sm font-medium text-white truncate">{profile.email}</p>
                <p className="text-xs text-white/70 mt-0.5">Customer</p>
              </div>
              <Link
                href={routes.dashboard}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-2 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                My Claims
              </Link>
              <Link
                href={routes.settings}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-2 py-2.5 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Account settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-2 py-2.5 text-sm text-red-200 hover:bg-white/10 rounded-lg transition-colors w-full text-left"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <p className="px-2 py-2.5 text-sm text-white/90">{TAGLINE}</p>
          )}
        </div>
      )}
    </header>
  );
}
