# Exploration: football-predictor

Colombian football match predictor — portfolio React web app. Explore phase (investigation only; no code written). Store mode: hybrid (OpenSpec + Engram).

## Current State

Empty repo (not git yet). `openspec/config.yaml` already initialized: schema `spec-driven`, persistence `hybrid`, `strict_tdd: false` (no runner/yet), test_command `""`. Runtime available: Node v24.16.0, npm, pnpm. No application code exists.

Product goal (context from init): user picks a Colombian team crest → app shows next fixture date → statistical winner prediction → validates hits/misses of the previous 5 predictions.

## Affected Areas (none yet — future change `football-predictor` will create)

- `src/` (scaffold) — Vite + React + TypeScript entry.
- `src/domain/prediction/` — pure prediction model (testable, no I/O).
- `src/data/` — data provider adapter + caching (API-Football primary, ESPN/TheSportsDB fallback).
- `src/store/` — client state + localStorage history (validation phase).
- `openspec/config.yaml` — after scaffold: set `strict_tdd` + `test_command` (vitest).

---

## A. Colombian football data source

**Verified facts (web, 2026-08-06):**
- **API-Football** (`api-football.com`, also on RapidAPI) — free tier **100 requests/day** (api key via `x-apisports-key` header or RapidAPI). Coverage list confirms **Colombia: Primera A (Liga BetPlay DIMAYOR), Primera B, Copa Colombia, Superliga, Liga Femenina**. All core endpoints (fixtures, standings, teams, H2H, match statistics, predictions) available on the free tier; no xG on any plan. Commercial use permitted even on free. Historical: several seasons.
- **football-data.org** — free tier **does NOT include Colombia** (12 playgrounds: Big 5, Championship, Eredivisie, Primeira Liga, Brazil Serie A, World Cup, Euro). Confirmed coverage table. **Rejected as an option.**
- **TheSportsDB** — free test key (`3`), crowd-sourced, ~30 req/min shared. Has **badges/crests** + fixtures/results + basic stats for "Colombian Liga DIMAYOR" (league id 4497, 2026 season). Weak on detailed stats; data can be stale/incomplete.
- **ESPN hidden API** (`site.api.espn.com/apis/site/v2/sports/soccer/col.1/scoreboard`, unofficial) — **free, no signup**, live scoreboard + finished results for Colombia Primera A. Great for result backfill (validation phase); unofficial → can change without warning.
- **openfootball / football.cs / third-party CSVs** — public-domain historical datasets (`openfootball/south-america` incl. Colombia). No key; but lag/non-live, suitable only for historical model training, not as the live fixture/result feed.

**Recommendation — Primary: API-Football** (best verified Colombia coverage on a free tier; single source for teams, fixtures, results, H2H, standings needed by MVP).
**Fallback: TheSportsDB** for crests/metadata + **ESPN hidden API** for zero-key fixture/result lookups. If the user wants a fully key-less MVP, swap primary to ESPN hidden + TheSportsDB crests and use a historical CSV only for the model (not live).

Trade-offs:
| Option | Free tier | Colombia | Crests | Notes |
|---|---|---|---|---|
| API-Football (primary) | 100 req/day | ✅ Primera A/B, Copa, Superliga | key | cache-first required; key only free; no xG |
| ESPN hidden API (fallback) | unlimited/no key | ✅ col.1 | ❌ | unofficial, brittle, but free result backfill |
| TheSportsDB (assets) | free key | ✅ DIMAYOR | ✅ | crowd-sourced; good for crests only |
| football-data.org | free | ❌ (not covered) | — | rejected |
| openfootball/CSV | no key | partial/historical | ❌ | stale; offline only |

**Risks:** free tier hard cap on unknown bursts; API key must live server-side (don't ship in the bundle — use an env var + dev `owners/mitigants;` for a portfolio deploy use a tiny serverless proxy or accept the free key being client-visible and reset it often). Colombia league/id/redeem mapping and Apertura/Clausura Rounds structure — verify league id (239 for Colombia-Primera A) at build.

---

## B. Statistical prediction approach (MVP)

**Options:**
1. **Simplified Poisson / attack–defense strength** — from season goals-for/against per team (home/away split + league average), derive expected goals → bivariate Poisson ⇒ 1X2 probabilities + score-line. Explainable, pure function, testable; needs ~1–2 seasons of league results. **Effort: Low-Medium.** ✅ recommend for MVP.
2. **Elo rating (+ home-field factor)** — from win/loss/draw plus home advantage. Explainable narrative, trivial data needs. **Effort: Low.** Good to add a secondary signal.
3. **Form-weighted strength** (last 5–6 games) — blunt recency correction; moderate. Good MVP garnish.
4. **ML (scikit-learn / xgboost)** — LogisticRegression/GradientBoosting with features (form, H2H, attack/defense, home/away). Better accuracy delta but needs an evaluation harness, more data, less explainable; the Colombian league sample is small (20 teams, limited seasons) and risks overfitting. **Effort: High. → later change**, not MVP.

**Recommendation:** Hybrid **simplified attack/defense Poisson + Elo/home factor** → express as 1X2 probabilities + predicted score. Visual (Portfolio) and explainable. Keep ML as a later, data-driven change.

**Minimal data:** per-team goals for/against (season, split home/away), league-average goals per game, current standings/schedule, and last-N results (form). Optional: H2H.

---

## C. Validating hits/misses of the previous 5 predictions

- **"Hit" definition (recommend):** full 1X2 outcome (win/draw/loss) resolved against the real match result. Exact scoreline is a nice secondary ("exact") but too hard to gate on. Model per prediction: pick `1X2`, show the predicted home/away score.
- **Prediction record (frontend-only MVP):** `PredictionRecord { fixtureId, home, away, kickoffDate, predictedX, predictedHomeGoals?, model, createdAt, lastUpdate }`. Store in **localStorage** (per-term only). No backend/DB needed for MVP user history; if multi-device/accounts later, move to a small DB (SQLite + server) in a later change.
- **Comparison:** on data load (or before a team's fixture), fetch completed results for the team (from the chosen data source: `fixtures?last=5` with status FINISHED) and reconcile each stored prediction (key on fixtureId/teams+kickoff) → set status `hit|miss|pending`. Present aggregate "5/5, 3/5…".

**Constraint:** for a frontend-only app, the verification depends entirely on the chosen data source returning **historical/period results** for Colombian teams. API-Football and ESPN hidden both provide last-N finished fixtures — that is the core dependency for this phase. If that is a risk, backfill a small snapshot at design time.

---

## D. Frontend React stack

**Build tooling: Vite + React + TypeScript** (recommended primary). Portfolio app is frontend-heavy, no SSR/SEO need; Vite is fastest to local, dev speed, smallest surface. **Next.js** only if SSR/SEO/route-level code-splitting with server environment becomes a must later — adds complexity and deployment weight. 

Libraries:
- **Server-state cache:** **TanStack Query** (fetch fixtures/results/teams, cache + invalidate once per day respect 100-day). ✅
- **Client state:** **Zustand** (light; over-react for rounded state). Fine for MVP to hold selected team + creunion.
- **Styling:** **Tailwind CSS** (rapid UI for portfolio, consistent); optional shadcn/ui later.
- **Charts:** **Recharts** (best-in-class declarative) for goal distribution / probability bars when the charts phase arrives.
- **Testing (orchestrator re-evaluate `strict_tdd`):** **Vitest + React Testing Library + `@testing-library/user-event`**, **MSW** for API mocking (RTL is Vite-native — match the runner). Set `test_command: "vitest run"` in config. **Playwright** for e2e, intentionally deferred out of MVP budget (adds heavy install) unless the reviewer wants it earlier.

---

## E. Architecture & MVP scope

**In scope — first change `football-predictor`:**
- Vite + React + TS + Tailwind scaffold; git init.
- Data layer: teams list + crests (API-Football, cache); next fixture per team; recent results for the selected team.
- Prediction: simplified Poisson + Elo/home → 1X2 probabilities + predicted scoreline, presented on the team page (explainable).
- UI: crest grid (team select), next-match card (date + kickoff), prediction panel.
- Tests for pure prediction module + data adapter (via MSW). Enable `strict_tdd` after scaffold.

**Out of scope (later changes):**
- History validation of previous 5 predictions (localStorage + result reconciliation + hit/miss UI) — needs results endpoint contract; clean change boundary.
- Charts (Recharts) + richer model (form weighting, H2H) — change 3.
- ML model, accounts/multi-device/DB, CI — change 4 iff data stacking warrants.

## Risks
- **Rate limit:** API-Football 100/day → cache-first; avoid per-fixture calls; design in a mock/dev source that the UI can run unchanged.
- **API key hygiene:** key lives in `env;` for a published portfolio avoid sitting the key in a public bundle (proxy or hide).
- **Colombia-specific data contracts:** verify Colombia league id / Apertura-Clausura round naming at build; ESPN alias `col.1`; TheSportsDB alias.
- **Data freshness for validation:** result backfill only as finished; some feeds slight lag.
- **Season format (2026):** 20 team / 19 matchday / Apertura & Clausura; playoffs (Apertura) and cuadrangulares (Clausura) — the "next fixture" must still be the next scheduled DIMAYOR league match (optionally attend cup fixtures).
- **Assumptions to validate:** (a) API-Football Colombia coverage details and id; (b) team crest asset availability/reliability (TheSportsDB/BSDB); (c) free-tier token stability.

## Ready for Proposal
**Yes.** The orchestrator should tell the user that the MVP first change is a Vite+React+TS scaffold with an API-Football data layer and a simplified attack/defense + Elo 1X2 predictor, with TheSportsDB/ESPN as fallback sources and Vitest+RTL for tests (unlocks evaluating `strict_tdd`). Prediction hit/miss history and time-series charts are deferred to later changes.