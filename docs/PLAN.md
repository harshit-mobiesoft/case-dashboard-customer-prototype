# Customer Dashboard Prototype — Plan

**Why:** Brian (client) asked for a customer-dashboard *prototype* we can walk CX through, as an
alternative to seeding a staging customer with cases stopped at different steps. We build the
prototype so that it also covers that second idea: one demo customer with many cases, each frozen at a
different step, and controls to move any case forward.

**Reference:** `../casedashboard` (Next 14 / Tailwind / Radix, talks to `api.smallclaims.app`).
The prototype keeps the same stack, visual language and route map, but has **no backend, no auth,
no payments, no staff app** — everything is simulated in the browser.

## Scope

In (customer side only, both services — Small Claims Hero and Activation Hero):

| Route | Screen |
|---|---|
| `/dashboard` | My cases — search, service/view filters, Open / Draft / Closed groups, resume/cancel drafts |
| `/dashboard/cases/[id]` | Case page — "whose turn" status bar, stats, Phase 1 (letter) / 2 (response) / 3 (court filing), response-window timer, activity feed |
| `…/questionnaire` | Activation Hero yes/no/skip questionnaire |
| `…/review` | Read letter, e-sign (simulated), request revision with reason chips |
| `…/documents` | "Get organized": Dropbox (simulated), evidence log, "no evidence" opt-out, downloadable documents |
| `…/outcome` | Mark outcome: settled / unsatisfactory / no response, early-proceed warning |
| `/dashboard/settings` | Profile form with validation |

Out: intake wizard, Stripe, magic-link auth, admin/staff screens, marketing/legal pages.

## Architecture (the "best practice" part)

1. **Domain layer is pure and typed** (`lib/domain`). One status model (`ClaimStatus`) drives
   *everything*: "whose turn" bucket, step timeline, phase locks, badges, CTAs. The reference app had
   this spread across `status-bucket.ts`, `claim-mapper.ts`, and ad-hoc checks in components that had
   already drifted once; here every lookup is a `Record<ClaimStatus, …>` so adding a status is a
   compile error until every surface handles it.
2. **State transitions are pure functions** (`lib/domain/transitions.ts`): `(case, input, now) → case`.
   They validate the current status (illegal transitions throw) and append activity. Unit-testable
   without React.
3. **Repository facade** (`lib/data/repository.ts`) is the only thing components call. It is async,
   adds configurable latency (so loading/disabled/error states are real), and can inject failures.
   Swapping it for the real API client later does not touch components.
4. **External store + `useSyncExternalStore`** persisted to `localStorage` (versioned key, try/catch
   guarded, falls back to seed). Hydrates after mount, so SSR output is deterministic — no hydration
   mismatches, no `Date.now()` in render paths that SSR touches.
5. **Seed data is relative to "now"** (`lib/data/seed.ts`) so "14 days left" is always true when
   the demo is opened, and `Reset demo` regenerates it.
6. **Demo controls** (floating panel): jump to any scenario, *Simulate: our team acts* (advances a case
   that is waiting on us — drafts the letter, applies a revision, approves a court task),
   *Fast-forward response window*, *Reset demo data*. Clearly labelled so nobody mistakes the
   prototype for production.
7. **No `dangerouslySetInnerHTML`.** The letter is structured data rendered as React nodes.
8. **Accessibility:** Radix Dialog/DropdownMenu/Switch (focus trap, ESC, aria), skip link, landmarks,
   `role=progressbar`, `aria-live` toasts, visible focus rings, reduced-motion safe, colour never the
   only signal (icons + text on buckets).
9. **Responsive:** mobile-first; every screen checked at 375px.
10. **Strict TypeScript**, ESLint (`next/core-web-vitals`), no `any`.

## Seeded scenarios

One customer (Alex Rivera). "My cases" lists 5 of them; the rest are scenario-only and reachable from the
Demo controls. Activation Hero has a case at every stage; Small Claims has a core set. The full, current
table lives in the README ("The seeded scenarios").

## Testing

- **Unit (Vitest):** status model exhaustiveness + buckets, every transition (happy and illegal),
  evidence "organized" rule, seed integrity (each scenario lands in its intended bucket), store
  persistence/corruption fallback, formatters.
- **Component (Testing Library):** status banner, step timeline, case card, e-sign dialog validation,
  revision form, outcome flow incl. early-warning dialog, evidence form, filters.
- **E2E (Playwright, Chromium):** full customer journeys end-to-end through the real UI — sign →
  send → fast-forward → outcome → court filing → close; revision loop; questionnaire; evidence/Dropbox;
  filters; persistence across reload; reset; mobile viewport smoke test; zero console errors.
- **Gates:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.

## Milestones

1. Scaffold (Next, Tailwind, tooling, test runners)
2. Domain + data layer (+ unit tests)
3. UI primitives, layout, demo panel
4. Dashboard list → Case page → Review/Sign → Documents → Outcome → Questionnaire → Court filing → Settings
5. Component + E2E tests, visual pass (desktop + mobile), fix, document (README)

## Addendum — scope extension (design parity + intake)

Requested after the first build: match the production design site-wide, add the intake flow, and a home
page with a pre-filled-email form leading to the dashboard.

- **Design parity:** Inter, production header/nav, solid status bar, card and badge wording,
  review/documents/settings layouts, home page + static legal pages copied from the reference.
- **Home → dashboard:** sign-in form pre-filled with the demo email; session flag in `localStorage`;
  dashboard routes guarded with `?next=` return (same-site paths only).
- **Intake:** `/smallclaimshero` and `/activationhero`, 7 steps, draft save/resume, county lookup,
  AH platform picker + auto-detected county, certified-mail upsell, simulated checkout with coupons and a
  declined-card path, then `/signup` → magic link → the new case on the dashboard.
- **Tests added:** intake validation/pricing/card/county/case-creation units, repository intake tests,
  step and full-flow component tests, E2E for home/sign-in, SC + AH intake, resume, signup, plus axe on
  every new screen.
