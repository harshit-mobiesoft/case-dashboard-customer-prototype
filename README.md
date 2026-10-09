# Case Dashboard — Customer Prototype

A clickable, **backend-less** prototype of the customer side of the Case Dashboard, built so we can
walk CX and the client through every state a customer can be in. It follows the production app
(`../casedashboard`) in stack, look and route map, but everything runs in the browser against
sample data — nothing is mailed, charged or sent to a server.

> Why it exists: Brian asked for a customer-dashboard prototype to discuss with CX — or a staging
> customer with cases stopped at different steps. This does both: one demo customer (Alex Rivera)
> with cases frozen at every step (5 on the dashboard, the rest one click away in the Demo controls).
> See [`docs/PLAN.md`](docs/PLAN.md) for the plan and scope.

## The customer journey it covers

`/` home (sign-in form, email **pre-filled** with the demo customer → dashboard) →
`/smallclaimshero` · `/activationhero` full 7-step **intake** (your info → defendant → filing court →
claim → review → certified-mail upsell → simulated checkout) → `/signup` (magic-link, simulated) →
`/dashboard` (cases, drafts that **Resume**) → case page, review & sign, documents & evidence,
outcome, questionnaire, court filing, settings. Static legal/support pages and the production
header are included. Dashboard routes require a sign-in (as in production) and return you
to where you were headed.

**Nothing blocks a walkthrough.** The intake is pre-filled (just press Continue), the e-sign dialog is pre-filled,
and no form needs to be valid to move on — empty questionnaire, edit request, court steps, outcome,
evidence, settings and sign-in all go through and the app fills in sensible defaults. The real
validation rules still exist: add `?validate=1` to any URL (it sticks for the tab; `?validate=0` turns it
off) to get blank forms and full validation back. Order-of-steps rules (e.g. you can't mail an unsigned
letter) always apply.

Checkout accepts the test card `4242 4242 4242 4242` (approved) or `4000 0000 0000 0002` (declined);
coupons `HERO10` / `HERO25`. Nothing real is charged or sent.

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Open **Demo controls** (bottom-left pill) to jump to any stage. When the case you are on is waiting on our
team (or the 21-day window), a "Simulate what happens next" button appears; "Reset demo data" starts over.
State persists in `localStorage`, so a reload keeps your progress.

| Script | What it does |
|---|---|
| `pnpm lint` / `pnpm typecheck` | ESLint (`next/core-web-vitals`, no `any`) / strict TypeScript |
| `pnpm test` | Vitest — domain, store/repository, intake and component tests |
| `pnpm test:e2e` | Playwright — production build, full journeys, axe accessibility, mobile |
| `pnpm check` | lint + typecheck + unit + build |

E2E builds into its own `.next-e2e` folder, so it is safe to run while `pnpm dev` is running. It needs a browser once: `pnpm exec playwright install chromium`
(or set `PW_CHROMIUM_PATH` to an existing compatible Chromium).
Set `NEXT_PUBLIC_MOCK_LATENCY_MS` to change simulated network delay (default 350; tests use 0).

## The seeded scenarios

One customer (Alex Rivera). **"My cases" shows 9 cases** — 5 Activation Hero and 4 Small Claims, so it looks like a real account; the other
15 are scenario-only and live in the **Demo controls → "Jump to a stage"** list, in journey order:
**Activation Hero at every stage** plus a handful of Small Claims.

| Activation Hero case | Stopped at |
|---|---|
| `ah-get-organized` | Needs evidence/Dropbox (or "no evidence") before the questionnaire |
| `ah-questionnaire-ready` | Organized — questionnaire is next |
| `ah-evidence-nudge` | Team drafting; Dropbox connected but no file attached yet |
| `ah-letter-in-progress` | Questionnaire done; team preparing the letter |
| `ah-revision-requested` | You asked for changes; team revising |
| `ah-awaiting-signature` | Letter ready to review & sign |
| `ah-ready-to-send` | Signed — press "Send letter" |
| `ah-waiting-window` / `ah-window-urgent` | Mailed: day 7 of 21 / day 19 of 21 (urgent) |
| `ah-outcome-needed` | Window closed — mark the outcome |
| `ah-court-just-started` | Court filing unlocked, first step open |
| `ah-court-needs-changes` / `ah-court-in-review` | A step was rejected with a note / submitted, under review |
| `ah-court-ready-to-close` | Every court step approved |
| `ah-closed-settled` / `ah-closed-court` | Closed: settled before court / after completing court filing |

Small Claims: `sc-letter-in-progress`, `sc-awaiting-signature`, `sc-ready-to-send`, `sc-waiting-window`,
`sc-court-needs-changes`, `sc-court-in-review`, `sc-court-ready-to-close`, `sc-closed-settled`.
Plus 2 unfinished intake drafts.

Dates are relative to "now", so countdowns are always true when you open the demo.

## How it's built

```
app/                    Next.js 14 App Router; pages are thin server components
components/
  ui/                   Button, Field*, Dialog (Radix), Toast, ProgressBar, …
  layout/ demo/         Nav, prototype banner, CaseGate, Demo controls
  case/ review/ documents/ outcome/ questionnaire/ court-filing/ settings/ dashboard/
lib/
  domain/               Pure, typed rules — no React, no I/O
    status.ts           THE single "whose turn is it" model (exhaustive Records)
    transitions.ts      (case, input, now) → case; illegal moves throw TransitionError
    steps.ts phases.ts  Timelines & phase locks as data
    letter.ts documents.ts tasks.ts …
  data/
    seed.ts             24 scenarios (Activation Hero at every stage + Small Claims), relative to now
    store.ts            external store + versioned/validated localStorage persistence
    repository.ts       the ONLY API components call (async, latency, failure injection)
  hooks/                useDemoState / useCase / useNow / useAsyncAction / useOptimisticValue
tests/                  unit (domain/store) + component (Testing Library)
e2e/                    Playwright journeys, axe scans, keyboard, mobile
```

Design decisions worth knowing:

- **One status model.** Everything (list badge, status bar, phase locks, CTAs) derives from
  `lib/domain/status.ts`. Adding a `ClaimStatus` is a compile error until it has copy, a badge and a bucket.
- **Transitions are pure and validated**, so the UI can't reach impossible states (e.g. mailing an unsigned letter).
- **Swap-ready data layer.** Components only call `repository`; replace it with the real API client later.
  Status names match the production API.
- **SSR-safe.** State hydrates after mount; the clock comes from `useNow()`; no hydration mismatches.
- **No `dangerouslySetInnerHTML`.** The letter is structured data rendered as React nodes.
- **Accessible by default.** Radix dialogs/menus (focus trap + focus restore), skip link, landmarks, one `h1`
  per screen, `aria-live` toasts, `role=progressbar`, AA contrast, reduced-motion, keyboard-only flows — all enforced by axe + keyboard E2E tests.
- **Optimistic toggles** (Dropbox "no evidence", reminder) that visibly revert on failure.

## Deliberately not in the prototype

Real Stripe/Shift4, real magic-link email, e-signature provider, Dropbox OAuth, Google address
autocomplete, real mail/PDFs, and the staff app. Those are simulated in the browser (card form, "open my
magic link" button, typed-name e-sign, plain-text downloads, a small built-in county table).

### Design parity

The visual layer follows `../casedashboard`: Inter, the brand ramp, header/nav (tagline when signed out,
avatar menu when in), the solid status bar (amber / brand /
green / gray) with white CTA, dashboard cards and badge wording, the home page sections, the intake
stepper and step layouts, review & sign two-column layout, documents sections. Deliberate deviation: the
solid status bar's white-on-amber/green contrast is below WCAG AA (as in production), so it is the one
element excluded from the axe scan.
