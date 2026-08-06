# Design: football-predictor

## Technical Approach

Greenfield Vite + React + TS scaffold with layered architecture (`domain` / `application` / `infrastructure` / `ui`) per `guia-practicas-esenciales.txt`. A pure, deterministic Poisson + Elo 1X2 predictor lives in `domain` (no I/O). TanStack Query owns server fetches behind a **cache-first** API-Football adapter (league 239) with mock source, Zustand owns only the selected team, localStorage owns prediction history. Spanish responsive UI components exported from OpenPencil designs. Satisfies specs `fixtures-data`, `match-prediction`, `prediction-history`.

## Architecture Decisions

| # | Decision | Options considered | Choice | Rationale |
|---|----------|-------------------|--------|-----------|
| D1 | Layout | feature/type folders | `src/{domain,application,infrastructure,ui,store,app}` | guía §14: carpeta por lógica |
| D2 | TS | base vs strict | `strict:true`, `noUncheckedIndexedAccess:true`, zero `any`/`@ts-ignore` | guía §4; fail fast |
| D3 | Predictor | ML / form-only / Poisson | simplified attack-defense Poisson + Elo + home adv, pure fn | deterministic, testable, explainable (spec) |
| D4 | Source | ESPN / TheSportsDB / API-Football | API-Football primary; TheSportsDB crests; mock default key-less | verified Colombia coverage; runs without key (spec) |
| D5 | Cache | no-cache vs cache-first+TTL+budget | cache-first TTL windows + daily budget guard | 100 req/day cap (spec) |
| D6 | API key | bundled vs dev-only | key dev-only via `.env`; prod build → mock; `.env` gitignored | spec: no key literal in bundle |
| D7 | State | guide | Query (server) / Zustand (selection) / useState (UI) | guía §6 |
| D8 | Boundary | inline checks vs Zod | Zod `safeParse` in adapters | guía §11 |
| D9 | Errors | generic `Error` | `DomainError` hierarchy + `code` | guía §13 |
| D10 | History | DB vs localStorage | localStorage repo behind interface | first change; spec |

## Data Flow (prediction)

```
TeamGrid ──select──▶ Zustand(selectedTeamId) ──▶ useNextFixture/useRecentResults (Query)
                                                        │ cache-first repo
                                                        ▼
                              API-Football client (Zod) / mock  ◀── daily budget guard
                                                        │
                    computePrediction(homeStrengths, awayStrengths)  [pure domain]
                                                        │
        PredictionPanel ◀─ outcome ES + probs + scoreline + rationale
        recordPrediction(record) ──▶ localStorage ──▶ reconcileHistory vs last-5 FINISHED ──▶ H/(H+M)
```

## Domain Model (types, safe)

```ts
type Outcome1X2 = '1' | 'X' | '2'
interface Team { id: string; name: string; crestUrl: string | null }
interface Fixture { id: string; home: string; away: string; kickoffUtc: string; status: 'SCHEDULED'|'TIMED'|'IN_PLAY'|'FINISHED' }
interface MatchResult { fixtureId: string; homeGoals: number; awayGoals: number; outcome: Outcome1X2 }
interface TeamStrengths { attack: number; defense: number; elo: number }
interface PredictionInput { home: TeamStrengths; away: TeamStrengths; homeAdvantage: number; leagueAvgGoals: { home: number; away: number } }
interface Prediction { probabilities: { home: number; draw: number; away: number }; predictedScore: { home: number; away: number }; outcome: Outcome1X2; rationale: string }
type HistoryStatus = 'pending' | 'hit' | 'miss'
interface PredictionRecord { fixtureId: string; home: string; away: string; kickoffUtc: string; predictedOutcome: Outcome1X2; model: 'poisson-elo-v1'; createdAt: string; status: HistoryStatus }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `.env.example`, `.gitignore`, `src/index.css` (Tailwind v4 `@import`) | Create | scaffold; `test_command: vitest run` |
| `src/domain/errors.ts`, `src/domain/football/model.ts` | Create | typed errors + shared types |
| `src/domain/prediction/{poisson,strengths,predictor,language}.ts` | Create | pure model (see below) |
| `src/domain/history/reconcile.ts` | Create | hit/miss/pending pure logic |
| `src/application/{ports,useCases}.ts` | Create | repo interfaces + DI use cases |
| `src/infrastructure/api-football/{client,schemas,repositories}.ts` | Create | Zod-validated adapter, batched call |
| `src/infrastructure/thesportsdb/crestClient.ts` | Create | crest lookup + initial fallback |
| `src/infrastructure/cache/{ttlCache,cacheFirst,dailyBudget}.ts` | Create | cache-first decorator + budget guard |
| `src/infrastructure/localstorage/historyRepository.ts` | Create | persist / corrupt-safe restore |
| `src/infrastructure/mock/{data,source}.ts` | Create | key-less source; selection in `di.ts` |
| `src/store/teamSelection.ts` | Create | Zustand: `selectedTeamId` |
| `src/ui/**` (`TeamGrid`, `TeamCard`, `NextMatchCard`, `PredictionPanel`, `HistorySection`, `states/*`) + `src/ui/hooks/*` | Create | presentational components; loading/error/empty |
| `src/app/{main,App,queryClient,di}.tsx` | Create | composition root, DI wiring |
| `src/test/{setup,handlers,fixtures}.ts` | Create | Vitest + RTL + MSW harness |
| `openspec/config.yaml` | Modify | `test_command: vitest run`; enable `strict_tdd` |

## Predictor Algorithm

`lambdaH = leagueAvgHome × homeAttack × awayDefense × homeAdvantage × eloFactor(Δelo)` (eloFactor = `10^((k·Δelo)/400)`, k≈0.1); symmetric for away. Build 7×7 independent-Poisson grid (goals 0–6) → sum margins → P1/PX/P2, renormalized; argmax cell = predicted scoreline. Deterministic; float tolerance 1e-9. Spanish labels: `Gana {name} ({pct}%)` / `Empate ({pct}%)`; within-tolerance ties present both outcomes, never raw 1X2. Missing inputs → fail fast `ValidationError`.

## Cache & Budget

TTL windows: teams 24h, next-fixture + results 15min (single batched call `fixtures?team={id}&last=10&next=1`), crests 30d. Daily counter in localStorage; <5 remaining → fail fast `ApiRateLimitError` → "límite diario alcanzado" state, no upstream call. Source selected in `di.ts`: key present → API-Football, else mock; UI unchanged.

## UI (OpenPencil → Tailwind v4)

Screens exported to React + Tailwind v4; Spanish copy. Grid 2/4/6 columns (mobile/tablet/desktop); prediction panel with probability bars, scoreline, one-to-two-sentence rationale; history badges hit/miss/pending + `H/(H+M)`. Skeleton / error+retry / empty states everywhere (spec).

## Testing Strategy

| Layer | What to Test | How |
|-------|--------------|-----|
| Unit | predictor (sum=1, determinism, home adv, scoreline↔outcome, ties, Spanish strings), reconcile (hit/miss/pending/out-of-window/corrupt), TTL + budget | Vitest |
| Integration | adapters vs MSW handlers; Zod rejects malformed payload | Vitest + MSW |
| Application | `computePrediction`, history flow with mock repos | Vitest |
| Component | loading/error/empty of TeamGrid, PredictionPanel, HistorySection | RTL |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration (greenfield, additive). Chained PR slices stacked to main, ≤400 lines each: S1 scaffold + domain types/errors + vitest harness; S2 predictor model + tests; S3 infrastructure (adapters, cache, budget, mock) + MSW tests; S4 UI screens (OpenPencil export) + responsive; S5 history (localStorage, reconciliation, config.yaml). Revert = remove `src/` + scaffold files.

## Open Questions

- [ ] Verify league id 239 and Apertura/Clausura round naming against a real call (smoke task in S3).
- [ ] Prod build ships the **mock** source (key never bundled) until a serverless proxy — confirm acceptable for the portfolio deploy.
- [ ] TheSportsDB free key (`3`) acceptable for crests, or hardcode the test key as default?
