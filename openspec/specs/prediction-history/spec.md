# prediction-history Specification

## Purpose

Persist per-fixture prediction records locally (localStorage), reconcile them against the last 5 FINISHED results, and present hit/miss/pending status plus an aggregate score in the UI.

## ADDED Requirements

### Requirement: Persist prediction records

The system MUST save a prediction record (fixtureId, home, away, kickoff, predicted outcome, model, createdAt) to localStorage when a prediction is made, and MUST restore it on reload.

#### Scenario: Record saved and restored
- GIVEN a user views a prediction for a fixture
- WHEN the prediction is rendered
- THEN a record is persisted to localStorage keyed by fixture identity
- AND reloading the app restores the record

#### Scenario: Duplicate fixture
- GIVEN a prediction record already exists for a fixture
- WHEN a new prediction for the same fixture is produced
- THEN the existing record is updated, not duplicated

#### Scenario: Corrupt storage
- GIVEN localStorage contains invalid or unparsable history data
- WHEN the app reads history
- THEN the corrupt entry is ignored safely without crashing
- THEN remaining valid records still load

### Requirement: Reconcile against last 5 FINISHED matches

The system MUST reconcile each stored prediction against the actual full-time 1X2 result of the corresponding FINISHED fixture, using the last 5 FINISHED matches of the involved team(s), and MUST mark each as hit, miss, or pending.

#### Scenario: Hit
- GIVEN a stored prediction whose predicted 1X2 outcome equals the real full-time outcome
- WHEN reconciliation runs
- THEN the record is marked `hit`

#### Scenario: Miss
- GIVEN a stored prediction whose predicted 1X2 outcome differs from the real full-time outcome
- WHEN reconciliation runs
- THEN the record is marked `miss`

#### Scenario: Pending and out-of-window
- GIVEN a fixture is not yet FINISHED, or falls outside the last 5 FINISHED matches
- WHEN reconciliation runs
- THEN the record is marked `pending` and does not count toward the aggregate

#### Scenario: No finished matches available
- GIVEN no FINISHED results exist for the team in the feed
- WHEN reconciliation runs
- THEN all records remain `pending`
- THEN no hits or misses are claimed

### Requirement: Aggregate score

The system MUST compute and display the aggregate hit count over the resolved window (e.g., "3/5") and MUST persist it across reloads.

#### Scenario: Aggregate computed
- GIVEN reconciled records with H hits and M misses within the window
- WHEN the history view renders
- THEN it shows "H/(H+M)" or equivalent Spanish phrasing
- AND pending records are excluded from the denominator

### Requirement: History UI with states

The history view MUST show loading, error, and empty states, and MUST be responsive across mobile/tablet/desktop.

#### Scenario: Loading and error
- GIVEN results are still fetching
- WHEN the history view renders
- THEN a loading state is shown
- THEN if fetching fails, an error state with retry is shown instead of a blank panel

#### Scenario: Empty history
- GIVEN no predictions have been recorded
- WHEN the history view renders
- THEN an empty state invites the user to make a first prediction
- AND the view still renders correctly on mobile and desktop

### Requirement: 1X2 definition of success

A prediction MUST be considered a hit based on the full-time 1X2 outcome only; exact scoreline matching MUST NOT be required.

#### Scenario: Wrong score, right outcome
- GIVEN a prediction predicted home win and the real result is a home win by any score
- WHEN reconciliation runs
- THEN the record is marked `hit` regardless of the exact scoreline

## Technical Constraints

History MUST satisfy the project quality standard (guia-practicas-esenciales): strict TS without `any`/`@ts-ignore`; typed errors; validation at the boundary (reconciled records parsed defensively); state separation — localStorage persistence and reconciliation live in `application/` or `infrastructure/`, pure logic in `domain/`; presentational history UI components receive data via hooks/props; loading/error/empty states explicit; responsive across mobile/tablet/desktop.