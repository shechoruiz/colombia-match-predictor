# Proposal: football-predictor

## Intent

Build a portfolio React web app where a user picks a **Liga BetPlay DIMAYOR (Primera A)** team crest, sees its next fixture, and gets a plain-language 1X2 prediction ("Gana Nacional (48%)") instead of raw 1X2 notation, plus a local hit/miss history over the last 5 finished matches. The empty repo becomes a runnable, tested MVP that establishes the architecture and proves the data + prediction pipeline before later phases (charts, ML).

## Scope

### In Scope (MVP — first change)
- Vite + React + TS + Tailwind scaffold; `git init`; Vitest + RTL + MSW test harness (enables `strict_tdd`).
- Data layer: teams + crests, next fixture per team, recent/last-N results — **cache-first** on API-Football (league 239), TheSportsDB/ESPN as fallback, with a mock/dev source so the UI runs uncoupled.
- Predictor: simplified attack/defense Poisson + Elo/home factor → 1X2 probabilities + predicted scoreline, rendered in natural Spanish ("Gana Atlético Nacional (48%)").
- UI (Español, responsive mobile/tablet/desktop): crest grid → team page → next-match card + prediction panel, with loading/error/empty states.
- History validation: `localStorage` prediction records reconciled vs last **5 FINISHED** matches → `hit|miss|pending` + aggregate score.
- Unit tests for the prediction model + data adapter (MSW); strict TS (no `any`/`@ts-ignore`).
- Quality standard: applies `guia-practicas-esenciales.txt` — self-explanatory names, single-responsibility functions, fail fast, DRY, state separation (server→TanStack Query, UI→useState, global→Zustand), pure components, composition over config, load/err/empty states, Zod at the edge, DI, typed errors, `domain/application/infrastructure` folders.

### Out of Scope (later changes)
- Charts (Recharts), form-weighting/H2H model refinement, ML, accounts/multi-device/DB, CI, Playwright e2e, English UI.

## Capabilities

> Contract with sdd-spec. All new (greenfield, `openspec/specs/` is empty).

### New Capabilities
- `fixtures-data`: fetch/cache teams, crests, next fixture, recent results across API-Football (primary) + fallbacks; mock/dev source.
- `match-prediction`: pure 1X2 predictor (Poisson + Elo) → probabilities + natural-language Spanish outcome.
- `prediction-history`: `localStorage` records; reconcile vs last-5 FINISHED; hit/miss/pending + aggregate.

### Modified Capabilities
None (`openspec/specs/` empty).

## Approach

Greenfield: scaffold with `domain` (pure predictor, no I/O) / `application` (use cases) / `infrastructure` (API-Football adapter + caching, Zod-validated boundary). TanStack Query owns server fetches; Zustand owns selected team; React state owns UI. Predictor as a pure testable function; adapter behind an interface (DI), mocked via MSW. Data source is cache-first to respect the 100 req/day cap. UI subjects are presentational, receiving data via hooks. Enable `strict_tdd` after scaffold adds a runner.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/prediction/` | New | Pure prediction model |
| `src/data/` | New | API adapter + cache + fallback + mock |
| `src/store/` | New | Zustand selection + history storage |
| `src/ui/` | New | Responsive Spanish UI + loading/err/empty |
| `openspec/config.yaml` | Modified | `test_command`/`strict_tdd` after runner |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API-Football 100 req/day | High | Cache-first, mock/dev source, batch calls |
| API key hygiene (public portfolio) | Med | Key in env; don't ship in bundle |
| League id 239 / Apertura-Clausura naming wrong | Med | Verify team/id at build against a fixtures call |
| Result backfill lag (validation) | Med | Reconcile only vs `FINISHED` |
| Repo not git yet; scaffold+app = large change | Med | Additive; split into reviewable slices |

## Rollback Plan

Greenfield with no prior behavior: the change is additive. Revert by removing `src/`, undoing scaffold files, and restoring `openspec/config.yaml`; history is only localStorage (clear to reset). No data migration, schema, or DB to revert.

## Dependencies

- API-Football free-tier key, env-managed (or fully key-less: ESPN + TheSportsDB).
- External: `api-football.com` (or RapidAPI). No others leveraged at this phase.

## Success Criteria

- [ ] App runs on mobile/tablet/desktop; Spanish UI; crest grid → fixture → prediction flow works.
- [ ] Prediction is 1X2 probabilities shown in natural Spanish (not raw 1X2).
- [ ] Hit/miss for last-5 FINISHED matches shown as aggregate; stored across reloads (localStorage).
- [ ] `vitest run` passes for prediction model + adapter; strict TS compiles with no `any`/`@ts-ignore`.
- [ ] Data layer runs with mock source (no key) and with API-Football key.
- [ ] `openspec/config.yaml` `test_command` set; `strict_tdd` enabled.

## Proposal question round (for user review)

Assumptions requiring sign-off (couldn't ask interactively as sub-agent):
1. Include `prediction-history` in the same first change (reuses results). Keep or defer to a follow-up change?
2. Primary source = API-Football (needs key, 100/day) vs fully key-less (ESPN + TheSportsDB-only)? Exploration assumed API-Football primary.
3. Team crest via TheSportsDB (`badge` only) vs uniform fallback — acceptable for MVP crest grid?
4. OK to split the first big change into chained PR slices during apply to stay ≤400 review lines?