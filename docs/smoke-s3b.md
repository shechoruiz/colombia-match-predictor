# S3b Smoke — League 239 + Apertura/Clausura

Slice: `football-predictor` S3b (mock source, DI, league smoke)
Date: 2026-08-06
Environment: no `API_FOOTBALL_KEY` configured (key-less run)

## Goal

Verify that the data layer targets Liga BetPlay DIMAYOR (league 239) and that
rounds are named `Apertura` / `Clausura`, returning a usable team catalog.

## Result with the mock source (no key) — PASSED

The app is designed to run key-less (design D6, spec "Mock/dev source
switchable"). The mock dataset stands in for league 239 and is verified by
tests:

| Check | Command | Result |
|-------|---------|--------|
| League id + tournament names | `npx vitest run src/infrastructure/mock/source.test.ts` | ✅ 8/8 — `MOCK_LEAGUE` = `{ id: '239', tournaments: ['Apertura', 'Clausura'] }`; every fixture round labelled `Apertura · Jornada N` or `Clausura · Jornada N` |
| DI composition (key-less → mock) | `npx vitest run src/app/di.test.ts` | ✅ 4/4 — `createDataSources({ no key })` → `kind: 'mock'`, `getTeamCatalog()` returns the 8 sample teams in name order |
| Full suite + types + build | `npm test` / `npm run typecheck` / `npm run build` | ✅ 97/97 tests, `tsc --noEmit` clean, `vite build` OK, no key literal in bundle |

## Pending: real league-239 smoke (requires API key)

Not executed because no `API_FOOTBALL_KEY` is present in this environment.

How to run once a key is configured:

```bash
# 1. Set the dev-only key (never committed, never VITE_-prefixed)
npm run keys:set        # writes .env with API_FOOTBALL_KEY=<your key>
npm run keys:verify     # confirms perms 600 + key absent from dist/

# 2. Start the app and inspect the data layer
npm run dev
```

Then verify in the running app (or by pointing the API-Football client at
`/teams?league=239&season=2026`):

- `GET /teams?league=239&season=<current year>` returns the Liga BetPlay team
  catalog (≈20 teams) with `team.id`, `team.name`, `team.logo`.
- Fixture responses use round strings like `Apertura - 1`, `Clausura - 4`
  (real API uses `league.round`), confirming the Apertura/Clausura naming.

Expected outcome: the API-Football source serves the catalog and the mock
remains the fallback only when no key is present (selector in `src/app/di.ts`).

## Artifacts

- `src/infrastructure/mock/data.ts` — `MOCK_LEAGUE` (id 239, tournaments) + sample fixtures/teams.
- `src/app/di.ts` — `selectDataSourceKind`: key → `api-football`, else `mock`.
