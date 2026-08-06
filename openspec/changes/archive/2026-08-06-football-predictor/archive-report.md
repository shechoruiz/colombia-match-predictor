# Archive Report: football-predictor

**Change**: football-predictor
**Status**: FINAL — implemented + verified + delivered
**Archived to**: `openspec/changes/archive/2026-08-06-football-predictor/`
**Mode**: hybrid (OpenSpec filesystem + Engram) · **Strict TDD** enabled (`vitest run`)
**Date**: 2026-08-06

## Review Gate

No native SDD review engine governed this change — delivery used GitHub PR review only.
`reviewGate` = **disabled/unmanaged** (kill switch off, no native review director active). No
native ledger/receipt/gate-context artifacts exist (verified: none in `openspec/changes/*/reviews/`
and none in Engram under `sdd/football-predictor/review/*`). Gate passes under the unmanaged relaxation.

## Task Completion Gate

`tasks.md` reports **14/14 implementation tasks `[x]`** (1.1–5.6). No stale unchecked tasks. Confirmed
by direct read of the persisted artifact and by the apply-progress trail (#120).

## Final State (terminal — per Final-State Authority)

Archived snapshot of the change as it shipped; intermediate snapshots (`apply-progress`,
`verify-report`) describe prior points, not the close state.

- **Test suite**: 165 tests green across 29 test files, measured live at archive time
  (`vitest run`). `tsc --noEmit` passes (exit 0). Production build passes.
- **Slices (all PRs merged to `main`)**: S1 (scaffold+domain, #2), S2 (predictor, #4),
  S3a (adapters, #8), S3b (mock/DI/ports, #10), S4 (UI, #13+#14 — S4a/S4b), S5 (history, #17+#18),
  +fix (verify-warnings, #20). **10 PRs total** merged to main.
- **Verify-warning fixes (PR #20, landed in `main` @ 1a62335)**, superseding the WARNINGs in the
  intermediate verify-report snapshot:
  1. `src/domain/history/reconcile.ts` normalizes the results feed by `kickoffUtc` before
     `slice(-RECONCILE_WINDOW_SIZE)`; `kickoffUtc` added to `MatchResult` (`src/domain/football/model.ts`).
     Mock source order was safe only by coincidence; now correct for newest-first API/MSW feeds.
  2. `scripts/manage-keys.mjs keys:verify` now exits non-zero when required keys are missing,
     making the CI gate usable.
  Tests went 164 → 165 after these fixes.
- **Deploy**: live at `colombia-match-predictor.netlify.app`; serves the full app (UI incl. mock
  Liga 239 in prod). No deploy/artifact run performed during archive — "deploy already live" is
  delivery context only.
- **Architecture**: layered `domain/application/infrastructure/ui`, Zustand store, TanStack Query,
  DI source selection (key → API-Football, else mock), cache-first TTL + daily budget, history
  localStorage corrupt-safe. strict TS, no `any`/`@ts-ignore`.
- **Specs:** 3 new capability specs (greenfield) promoted from change deltas to base specs (see below).

## Specs Synced

Project `openspec/specs/` was empty (greenfield); each delta spec was a full spec and was copied verbatim:

| Domain | Action | Requirements added |
|--------|--------|---------------------|
| `openspec/specs/fixtures-data/spec.md` | Created | 8 |
| `openspec/specs/match-prediction/spec.md` | Created | 6 |
| `openspec/specs/prediction-history/spec.md` | Created | 6 |

No modified/removed/renamed requirements (all new).

## Archive Contents (audit trail)

- proposal.md
- specs/{fixtures-data,match-prediction,prediction-history}/spec.md
- design.md
- tasks.md (14/14 complete)
- exploration.md
- archive-report.md (this file)

## Traceability — Engram Observation IDs

| Artifact | Topic | observation-id |
|----------|-------|----------------|
| proposal | `sdd/football-predictor/proposal` | #110 |
| spec | `sdd/football-predictor/spec` | #113 |
| design | `sdd/football-predictor/design` | #114 |
| tasks | `sdd/football-predictor/tasks` | #117 |
| apply-progress | `sdd/football-predictor/apply-progress` | #120 |
| verify-report (snapshot) | `sdd/football-predictor/verify-report` | #127 |
| verify-warning fix (post-snapshot) | `sdd/football-predictor/verify-report` corroboration | #129 |
| archive-report | `sdd/football-predictor/archive-report` | (this save) |

Note: `#127` (verify-report snapshot, `pass_with_warnings`) describes verify-time state. Its two WARNINGs
were later fixed in PR #20 (landed before close); final state above reflects the fixes. It is retained
as historical record, superseded at close by the fix evidence.

## Risks / Notes

- Verify-report's "reconcile feed escalates to CRITICAL when real API feed enabled" risk is fully
  resolved by the PR #20 `kickoffUtc` sort; no residual reconcile risk.
- Prod deliberately serves the **mock** source (no serverless proxy); real-API prediction is not
  reachable in prod. Accepted design open question, not an archive blocker.
- Local feature branches (`feat/history`, `feat/history-sa/b`) and remote refs
  (`origin/feat/history-sa`, `origin/feat/history-sb`, `origin/fix/verify-warnings`) are still present
  in the repo and were not cleaned by archive — branch cleanup is out of archive scope (artifacts only).

## Rollback Note

Change is additive greenfield. To roll back, remove `src/`, scaffold files, and revert
`openspec/config.yaml`; clear localStorage to reset history. No DB/schema migration.