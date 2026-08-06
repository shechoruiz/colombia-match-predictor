# Colombia Match Predictor

A portfolio web app that predicts Colombian football (Liga BetPlay DIMAYOR — Primera A) match outcomes from statistics. Pick a team's crest, see the next fixture, get an explainable 1X2 prediction in plain Spanish, and track whether your last 5 predictions hit.

**Live site:** https://colombia-match-predictor.netlify.app

## Quick path

1. `npm install`
2. `npm run dev` — start the dev server
3. `node scripts/manage-keys.mjs set API_FOOTBALL_KEY <key>` — optional, enables real data
4. `npm test` / `npm run typecheck` — run the suite

> Without an API key the app runs on the built-in mock source. Production deploys use mock by design — real keys are dev-only and never shipped.

## What it does

| Capability | Description |
|---|---|
| `fixtures-data` | Next fixture and recent finished results per team (Primera A only) |
| `match-prediction` | 1X2 outcome with probability, shown in plain Spanish ("Gana Atlético Nacional (48%)"), powered by a Poisson + Elo hybrid |
| `prediction-history` | Last 5 predictions validated against real full-time results, stored in `localStorage` (no accounts, no backend) |

A prediction **hits** when the real full-time outcome matches the predicted one (1X2) — not the exact scoreline.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Vite + React 19 + TypeScript (strict) |
| State | TanStack Query (server) · Zustand (global) · `useState` (UI) |
| Styling | Tailwind CSS v4 (responsive screens built directly per the design; OpenPencil export tracked as future polish) |
| Testing | Vitest + React Testing Library + MSW |
| Data | API-Football (league id 239, dev-only key) · TheSportsDB (crests) |
| Deploy | Netlify (continuous deployment: PR previews + production on `main` merge) |

## Architecture

Clean, layer-separated — `domain/` (pure logic), `application/` (use cases, DI ports), `infrastructure/` (API adapters, cache, localStorage), `ui/` (presentation).

Key decisions:

- **Predictor:** simplified attack/defense Poisson grid + Elo/home-advantage factor → 1X2 probabilities. Deterministic and unit-testable.
- **Rate limit (100 req/day):** cache-first with TTL windows (teams 24h, fixtures+results 15min, crests 30d) and a daily budget guard that fails fast before exhausting the quota.
- **Validation:** Zod schemas at the boundary; typed domain errors (`ValidationError`, `ApiRateLimitError`).
- **Security:** API keys are **never** prefixed `VITE_` (Vite only injects `VITE_*` into the public bundle), stored in gitignored `.env` with `0600` perms, and `scripts/manage-keys.mjs verify` checks no key leaks into `dist/`.

## Project standards

This project follows a personal quality checklist (see `guia-practicas-esenciales`): names that explain intent, one responsibility per function, fail fast with typed errors, no `any`/`@ts-ignore`, DRY, separation of state types, pure components, explicit loading/error/empty states, and behavior (not implementation) tests.

## SDD progress

The project is built with **SDD** (Spec-Driven Development). Artifacts live in `openspec/` and the persistent memory store.

| Phase | Status |
|---|---|
| Explore | ✅ Done — sources, prediction approach, stack compared |
| Proposal | ✅ Done — MVP scope confirmed |
| Spec | ✅ Done — `fixtures-data`, `match-prediction`, `prediction-history` |
| Design | ✅ Done — layered architecture, cache/budget, delivery plan |
| Tasks | ✅ Done — 20 tasks across 6 stacked slices |
| Apply | ✅ Done — S1–S5 implemented (TDD strict) |
| Verify | ✅ Done — 34/34 scenarios, 0 CRITICAL, PASS WITH WARNINGS |
| Archive | ✅ Done — specs promoted to `openspec/specs/` |

### Delivery slices (stacked-to-main)

| Slice | Scope | Status |
|---|---|---|
| S1 | Scaffold, git, config, secure key manager, domain model | ✅ Merged (PR #2) |
| S2 | Pure predictor model (strengths, Poisson, 1X2, Spanish labels) | ✅ Merged (PR #4) |
| S3a | Boundary + adapters + cache + daily budget | ✅ Merged (PRs #7 / #8) |
| S3b | Mock source, DI, league smoke check | ✅ Merged (PR #10) |
| S4 | Store, UI screens, composition root | ✅ Merged (PRs #13 / #14) |
| S5 | History + reconciliation + wiring | ✅ Merged (PRs #17 / #18) |
| Fix | Reconcile feed order + keys:verify exit gate (verify warnings) | ✅ Merged (PR #20) |

All 10 PRs merged to `main`. The change is archived under `openspec/changes/archive/2026-08-06-football-predictor/`, and the three capability specs are now the project baseline in `openspec/specs/`.

> **Real-data consumption (next):** production ships the built-in mock source by design. To exercise the real API-Football feed (league id 239), set `API_FOOTBALL_KEY` locally and run the documented smoke check (`docs/smoke-s3b.md`). A serverless proxy is the planned path to serve real data in production without leaking keys.

## Development notes

- `openspec/` holds SDD artifacts — the archived change lives in `openspec/changes/archive/2026-08-06-football-predictor/`, and the baseline capability specs in `openspec/specs/`.
- Commit convention: conventional commits, one reviewable work unit per commit.
- Each PR must link an approved issue and carry exactly one `type:*` label.
