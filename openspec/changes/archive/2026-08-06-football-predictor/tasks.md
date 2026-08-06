# Tasks: football-predictor

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,200 (authored) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | S1 → S2 → S3a → S3b → S4 → S5 |
| Delivery strategy | ask-on-risk (resolved → stacked-to-main) |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

> The task placeholder plan started as 5 slices (S1–S5). Estimating S3 confirmed it
> exceeds the 400-line budget by itself, so per the design's "divide si excede" rule it
> is split into two stacked PRs **S3a** and **S3b**. Net effect: all slices stay ≤400; same
> final deliverable, one more PR in the chain. S1 also touches `openspec/config.yaml`
> (enable `strict_tdd` + set `test_command`) because that is when the runner exists.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1.1 | Scaffold Vite+React+TS+Tailwind | S1 | `vitest run` (empty pass) | `npm run dev` | Remove `package.json`, tsconfig*/vite/index/.env.example/.gitignore/src/index.css |
| 1.2 | git init + history | S1 | `git status` clean | N/A (no runtime) | `git rm -r .` + re-init |
| 1.3 | Test harness + config enable | S1 | `vitest run` (setup loads) | `strict_tdd` enabled | revert `openspec/config.yaml` |
| 1.4 | Secure key manager script | S1 | `manage-keys verify` | `node scripts/manage-keys.mjs status` | remove `scripts/manage-keys.*`, revert `.env`/`.gitignore` |
| 1.5 | Domain types + errors | S1 | `vitest run src/domain` | N/A (pure) | remove `src/domain/football/*`, `errors.ts` |
| 2.1 | Strengths+Poisson grid | S2 | `vitest run src/domain/prediction` | N/A (pure) | remove `strengths.ts`, `poisson.ts` |
| 2.2 | Predictor + outcome | S2 | same | N/A (pure) | remove `predictor.ts` |
| 2.3 | Spanish outcome + ties | S2 | same | N/A (pure) | remove `language.ts` |
| 3.1 | Zod schemas (teams/fixtures/results/crest) | S3a | `vitest run src/infrastructure/api-football` | N/A — boundary | remove `schemas.ts` |
| 3.2 | API-Football client + cached repositories | S3a | `vitest run src/infrastructure` (MSW) | MSW adapter test | remove `client.ts`,`repositories.ts` |
| 3.3 | TTL cache + cache-first decorator | S3a | `vitest run src/infrastructure/cache` | N/A | remove `cache/*` |
| 3.4 | Daily budget guard | S3a | same | budget <5 blocks call | remove `dailyBudget.ts` |
| 3.5 | Crest client (TheSportsDB) | S3a | `vitest run crestClient` | N/A | remove `crestClient.ts` |
| 3.6 | MSW handlers + adapter integration tests | S3a | `vitest run src/test` | RTL+MSW | remove `test/handlers.ts` |
| 3.7 | Mock data + mock source | S3b | `vitest run src/infrastructure/mock` | `npm run dev` shows crests w/o key | remove `mock/*` |
| 3.8 | DI source selection (key→api / else mock) | S3b | `vitest run` | dev with/without key | remove `di` wiring |
| 3.9 | League 239 smoke check | S3b | `npm run dev` + real call | verify teams/rounds | no unapi key shipped |
| 4.1 | TeamSelection store (Zustand) | S4 | `vitest run src/store` | manual pick team | remove `store/teamSelection.ts` |
| 4.2 | export TeamGrid/TeamCard responsive screens | S4 | `vitest run src/ui` (comp test) | `npm run dev` resize | remove relevant `ui/*` + styles |
| 4.3 | NextMatchCard + PredictionPanel + states | S4 | `vitest run src/ui` | manual flow | remove panel files |
| 4.4 | App composition root + QueryClient + di | S4 | `vitest run` | `npm run dev` full flow | remove `src/app/*` |
| 5.1 | Reconcile pure logic (domain/history) | S5 | `vitest run src/domain/history` | N/A (pure) | remove `reconcile.ts` |
| 5.2 | localStorage repo (corrupt-safe) | S5 | `vitest run src/infrastructure` | reload via dev | remove `historyRepository.ts` |
| 5.3 | HistorySection UI + aggregate + states | S5 | `vitest run src/ui` comp | reload persists history | remove section files |

## Slice S1 — Scaffold, git, config, domain foundation (~170 lines, Low risk)

- [x] 1.1 Create `package.json` + `package-lock.json`: Vite, React 19, TS strict, Tailwind v4, TanStack Query, Zustand, Vitest, RTL, MSW deps.
- [x] 1.2 Create `vite.config.ts` (react plugin, vitest config, tailwind), `tsconfig.json` with `strict:true` + `noUncheckedIndexedAccess:true`, `index.html`, `src/index.css` (Tailwind v4 `@import`).
- [x] 1.3 `git init`; write `.gitignore` (node_modules, dist, `.env`), `.env.example` (API-Football key placeholder).
- [x] 1.4 Create `src/test/setup.ts` + `vitest` matcher config; confirm `vitest run` executes.
- [x] 1.5 Edit `openspec/config.yaml`: `apply.test_command: vitest run`, `verify.test_command: vitest run`, `apply.tdd: true`.
- [x] 1.6 **Secure key manager**: create `scripts/manage-keys.mjs` (`set`, `status`, `verify`) + `.env.example` with NON-`VITE_` names (`API_FOOTBALL_KEY`, `THESPORTSDB_KEY`); `.env` in `.gitignore`; `verify` checks keys never appear in `dist/` and file perms are 600; keys are never injected into the public bundle.
- [x] 1.7 Create `src/domain/errors.ts`: `DomainError` base + `ValidationError` + `ApiRateLimit/RateError` typed with `code`.
- [x] 1.8 Create `src/domain/football/model.ts`: all types (Team, Fixture, MatchResult, TeamStrengths, PredictionInput, Prediction, Outcome1X2, PredictionRecord, HistoryStatus).
- [x] 1.9 Test: `src/domain/football/model.test.ts` (type guards / literal unions) — RED then GREEN.

## Slice S2 — Pure predictor model + tests (~230, Low risk)

- [x] 2.1 Create `src/domain/prediction/strengths.ts`: `eloFactor(Δelo)` + `computeStrengths` (attack/defense from recent results), pure, no I/O.
- [x] 2.2 Create `src/domain/prediction/poisson.ts`: builds 7×7 independent-Poisson grid (goals 0–6) from lambdas, returns P1/PX/P2, renormalized, tolerance 1e-9.
- [x] 2.3 Create `src/domain/prediction/predictor.ts`: `computePrediction(input)` hoisting strengths→lambda→probabilities→argmax scoreline; fail fast `ValidationError` on missing inputs.
- [x] 2.4 Create `src/domain/prediction/language.ts`: Spanish labels "Gana {name} ({pct}%)" / "Empate ({pct}%)"; tie-within-tolerance outputs "Empate".
- [x] 2.5 Tests: `predictor.test.ts` (sum=1, determinism, home advantage, isolated tie behavior, scoreline-outcome coherence, Spanish string shapes).
- [x] 2.6 Test: missing inputs raise typed `ValidationError`, never fabricated probs.

## Slice S3a — Boundary + adapters + cache + budget (~260, Medium risk)

- [x] 3.1 Create `src/infrastructure/api-football/schemas.ts`: Zod `safeParse` schemas for teams, next fixture, last-N results.
- [x] 3.2 Create `src/infrastructure/api-football/client.ts`: fetch wrapper (env key, request options, error mapping).
- [x] 3.3 Create `src/infrastructure/api-football/repositories.ts`: maps API shapes → domain types; uses batched `fixtures?team&last=10&next=1`; surfaces typed failures.
- [x] 3.4 Create `src/infrastructure/cache/ttlCache.ts` + `cacheFirst.ts`: TTL windows (teams 24h, fixture+results 15min, crest 30d), serve fresh / fetch stale; decorated repo.
- [x] 3.5 Create `src/infrastructure/cache/dailyBudget.ts`: localStorage daily counter; <5 remaining → `ApiRateLimitError` (fail fast, no upstream).
- [x] 3.6 Create `src/infrastructure/thesportsdb/crestClient.ts`: crest lookup w/ default test key `'3'` + live fallback to placeholder.
- [x] 3.7 Create `src/test/handlers.ts` (MSW) covering success, 5xx, malformed payload.
- [x] 3.8 Tests: adapter integration (MSW), Zod rejects malformed payload, cache TTL + budget guard (RED→GREEN).

## Slice S3b — Mock source, DI, league smoke (~180, Low risk)

- [x] 3.9 Create `src/infrastructure/mock/data.ts` (fixtures/teams/results sample) + `source.ts` (mock repos implementing port).
- [x] 3.10 Create `src/application/data/ports.ts`: `TeamRepository` / `FixtureRepository` interface + create `src/application/useCases.ts`.
- [x] 3.11 Create `src/app/di.ts` source selection: key present→API-Football, else mock; UI layer untouched.
- [x] 3.12 Smoke task (runtime): verify league 239 + Apertura/Clausura naming returns teams (record result).

## Slice S4 — Store, UI screens, composition root (~250, Medium risk)

- [x] 4.1 Create `src/store/teamSelection.ts` (Zustand store: `selectedTeamId` + setter).
- [x] 4.2 Recreate `src/ui/TeamGrid` + `TeamCard` from OpenPencil export; responsive 2/4/6 cols + loading/error/empty; tell each updates hooks.
- [x] 4.3 `src/ui/NextMatchCard`: next/fixture display; no-fixture empty state; Spanish dates.
- [x] 4.4 `src/ui/PredictionPanel`: probability bars, scoreline, natural Spanish + rationale; skeleton + error+retry.
- [x] 4.5 `src/ui/hooks/useFixtures.ts`: TanStack Query wiring (next fixture + recent results) with cache refetch windows.
- [x] 4.6 `src/app/{main,App}.tsx` + `queryClient.ts`: composition root, render flow grid→select→panel.
- [x] 4.7 Component tests (RTL): loading, error+retry, empty for TeamGrid / PredictionPanel.

## Slice S5 — History + reconciliation + polish (~220, Low risk)

- [x] 5.1 Create `src/domain/history/reconcile.ts`: mark hit/miss/pending vs last-5 FINISHED; `pending` & out-of-window excluded; pure.
- [x] 5.2 Create `src/infrastructure/historyRepository.ts`: localStorage persist / corrupt-safe restore / dedupe by fixtureId.
- [x] 5.3 Create `src/application/historyUseCase.ts`: `recordPrediction`, `reconcileHistory` (DI repos).
- [x] 5.4 Create `src/ui/HistorySection`: hit/miss/pending badges + `H/(H+M)`; loading/error/empty; responsive.
- [x] 5.5 Wire History into app + run-end history re-concile on results load.
- [x] 5.6 Unit tests reconcile (hit/miss/pending/out-of-window/no-finished/corrupt) + component test HistorySection empty/error.

## Verification Per Slice

Verification is embedded in each work order: each slice runs `vitest run` and the named runtime harness toward the integration GO; pipeline liveness per slice. Full `verify` phase (sdd-verify) runs `vitest run` on whole `src` + strict `tsc --noEmit` (no `any`/`@ts-ignore`) at end.