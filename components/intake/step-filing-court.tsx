"use client";

import { MapPin, Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { repository } from "@/lib/data/repository";
import { PLATFORMS } from "@/lib/domain/directory";
import { countyLabel, type County } from "@/lib/domain/counties";
import { validateFilingCourt } from "@/lib/domain/intake-validation";
import { cn } from "@/lib/utils";
import { StepActions } from "./step-actions";
import type { StepProps } from "./step-claimant";

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0", checked ? "border-brand-500" : "border-gray-300")}
    >
      {checked && <span className="h-2 w-2 rounded-full bg-brand-500" />}
    </span>
  );
}

function PopularBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
      Most Popular Choice
    </span>
  );
}

interface Props extends StepProps {
  /** Activation Hero whose county couldn't be auto-detected: search only. */
  ahFallback?: boolean;
}

export function StepFilingCourt({ form, update, onNext, onBack, ahFallback, saving, strict }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!ahFallback);
  const [suggestions, setSuggestions] = useState<{ claimant: County | null; defendant: County | null }>({
    claimant: null,
    defendant: null,
  });
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState(ahFallback ? form.claimantZip : "");
  const [results, setResults] = useState<County[]>([]);
  const [searched, setSearched] = useState(false);

  const isAH = form.service === "activation_hero";
  const defendantZip = isAH ? (PLATFORMS.find((p) => p.id === form.platformId)?.address.zip ?? null) : form.defendantZip || null;

  useEffect(() => {
    if (ahFallback) return;
    let cancelled = false;
    setLoading(true);
    repository
      .suggestCounties(form.claimantZip, defendantZip)
      .then((res) => !cancelled && setSuggestions(res))
      .catch(() => !cancelled && setSuggestions({ claimant: null, defendant: null }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ahFallback, form.claimantZip, defendantZip]);

  // Debounced manual search.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    let cancelled = false;
    timer.current = setTimeout(() => {
      repository
        .searchCounties(query)
        .then((r) => !cancelled && (setResults(r), setSearched(true)))
        .catch(() => !cancelled && (setResults([]), setSearched(true)));
    }, 300);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const { shared, youOnly, defOnly } = useMemo(() => {
    const you = suggestions.claimant;
    const def = suggestions.defendant;
    if (you && def && you.id === def.id) return { shared: you, youOnly: null, defOnly: null };
    return { shared: null, youOnly: you, defOnly: def };
  }, [suggestions]);

  const suggestedIds = new Set([shared?.id, youOnly?.id, defOnly?.id].filter(Boolean));
  const searchSelected = searchMode || (!!form.countyId && !loading && !suggestedIds.has(form.countyId));
  const hasAny = !!(shared || youOnly || defOnly);

  function select(county: County, fromSearch = false) {
    update({ countyId: county.id, countyName: countyLabel(county), countyState: county.state });
    setSearchMode(fromSearch);
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
  }

  function chooseSearch() {
    if (searchSelected) return;
    setSearchMode(true);
    if (form.countyId && suggestedIds.has(form.countyId)) update({ countyId: "", countyName: "", countyState: "" });
  }

  function handleContinue() {
    const errs = strict ? validateFilingCourt(form) : {};
    setError(errs.countyId ?? null);
    if (!errs.countyId) onNext();
  }

  const youAddress = [form.claimantAddress, form.claimantCity, form.claimantState, form.claimantZip].filter(Boolean).join(", ");
  const defAddress = isAH
    ? form.platformName
    : [form.defendantAddress, form.defendantCity, form.defendantState, form.defendantZip].filter(Boolean).join(", ");
  const defLabel = isAH ? "Platform's Local Courthouse" : "Their Local Courthouse";

  function CountyCard({ county, header }: { county: County; header: React.ReactNode }) {
    const on = !searchSelected && form.countyId === county.id;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => select(county)}
        className={cn(
          "w-full text-left border rounded-lg overflow-hidden transition-colors cursor-pointer",
          on ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400" : "border-gray-200 hover:border-brand-300 hover:bg-gray-50",
        )}
      >
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">{header}</div>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <RadioDot checked={on} />
          <p className={cn("font-medium text-sm", on ? "text-brand-700" : "text-gray-800")}>{countyLabel(county)}</p>
        </div>
      </button>
    );
  }

  const searchBox = (
    <div className="relative flex-1 min-w-0">
      <label htmlFor="county-search" className="sr-only">
        Search by county name or ZIP
      </label>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" aria-hidden="true" />
      <input
        id="county-search"
        type="text"
        value={query}
        onFocus={ahFallback ? undefined : chooseSearch}
        onChange={(e) => {
          if (!ahFallback) chooseSearch();
          setQuery(e.target.value);
        }}
        placeholder="Search by county name or ZIP…"
        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg placeholder:text-gray-500"
      />
      {query.trim().length >= 2 && searched && results.length === 0 && (
        <p className="text-xs text-gray-500 mt-1 px-1">
          No counties found for &ldquo;{query.trim()}&rdquo; — try a different name.
        </p>
      )}
      {results.length > 0 && (
        <ul
          aria-label="County results"
          className="mt-1 border border-gray-200 rounded-lg shadow-sm bg-white max-h-48 overflow-y-auto z-10 relative"
        >
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => select(c, true)}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors",
                  form.countyId === c.id ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700 hover:bg-gray-50",
                )}
              >
                {countyLabel(c)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {ahFallback ? "Help us locate your county courthouse" : "Filing court"}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {ahFallback
          ? "This detail will help us to determine the local laws used when creating the demand letter."
          : "Select the county where your case will be filed."}
      </p>

      <div className="mb-8">
        {ahFallback && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
            We couldn&apos;t automatically detect your courthouse from your address. Please search for your county below.
          </div>
        )}

        {!ahFallback && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-gray-500" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-700">Filing county</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">File in the county where:</p>
              <ul className="space-y-0.5 list-none">
                <li>
                  · The defendant lives or has their principal place of business, <span className="font-medium">or</span>
                </li>
                <li>· The incident or transaction took place</li>
              </ul>
            </div>
          </>
        )}

        {!ahFallback && loading && (
          <div className="space-y-3 mb-4" role="status" aria-label="Looking up courthouses">
            {[0, 1].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <div className="h-5 w-10 bg-gray-200 rounded-full" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
                <div className="px-3 py-3">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!ahFallback && !loading && hasAny && (
          <div role="radiogroup" aria-label="Suggested courthouses" className="space-y-3 mb-4">
            {shared && (
              <CountyCard
                county={shared}
                header={
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700">Same county for both addresses</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{defAddress || youAddress}</p>
                  </div>
                }
              />
            )}
            {youOnly && (
              <CountyCard
                county={youOnly}
                header={
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 flex items-center gap-2 flex-wrap">
                      My Local Courthouse
                      <PopularBadge />
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{youAddress}</p>
                  </div>
                }
              />
            )}
            {defOnly && (
              <CountyCard
                county={defOnly}
                header={
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{defLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{defAddress}</p>
                  </div>
                }
              />
            )}
          </div>
        )}

        {ahFallback ? (
          searchBox
        ) : (
          <div
            className={cn(
              "border rounded-lg transition-colors",
              searchSelected ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400" : "border-gray-200",
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={searchSelected}
              onClick={chooseSearch}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
            >
              <RadioDot checked={searchSelected} />
              <span className="text-sm font-medium text-gray-800">Search for another courthouse</span>
            </button>
            <div className="px-3 pb-3">{searchBox}</div>
          </div>
        )}

        {form.countyName ? (
          <p className="text-xs text-brand-700 mt-1.5" aria-live="polite">
            Selected: {form.countyName}
          </p>
        ) : error ? (
          <p className="text-xs text-red-700 mt-1.5" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <StepActions hasErrors={!!error} onBack={onBack} onNext={handleContinue} busy={saving} />
    </div>
  );
}
