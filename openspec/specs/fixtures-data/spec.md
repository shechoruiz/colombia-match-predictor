# fixtures-data Specification

## Purpose

Fetch and present Liga BetPlay DIMAYOR (league 239) teams+crests, next fixture, and recent FINISHED results. API-Football primary, mock/dev source for key-less runs, cache-first.

## ADDED Requirements

### Requirement: Team catalog with crests

The system MUST load the league team catalog (name + crest) and MUST present it as a responsive grid. Crests MUST come from TheSportsDB when available.

#### Scenario: Teams load successfully
- GIVEN a working data source → WHEN the home view opens → a sorted grid of team crests renders, each cell showing name and crest.

#### Scenario: Source unavailable
- GIVEN the data source errors → WHEN the catalog is requested → the UI shows an error state with a retry action.

### Requirement: Next fixture per selected team

The system MUST return the next scheduled DIMAYOR league fixture (home, away, kickoff datetime) for a selected team.

#### Scenario: Next fixture resolved
- GIVEN a team is selected → WHEN the next fixture is requested → the next not-kicked-off league match is returned with team names and kickoff datetime.

#### Scenario: No upcoming fixture
- GIVEN a selected team has no scheduled league match remaining → WHEN the next fixture is requested → an empty state is shown with an explanatory message.

### Requirement: Recent FINISHED results

The system MUST provide the last-N FINISHED results for a team (home, away, full-time score, status FINISHED) for prediction and history reconciliation.

#### Scenario: Recent results returned
- GIVEN a team has FINISHED league matches → WHEN recent results are requested → only status FINISHED matches are returned, each with the full-time score.

#### Scenario: No finished matches
- GIVEN a team has no FINISHED matches in the feed → WHEN recent results are requested → an empty collection is returned for the consumer to render as an empty state.

### Requirement: Cache-first data access

The system MUST serve reads from cache when fresh and MUST NOT re-fetch the same resource within the cache window, to respect the 100 req/day cap.

- GIVEN a fresh cached resource → WHEN requested again → the cache is served without an upstream call.
- GIVEN a resource not cached or stale → WHEN requested → the source is fetched and cached.

### Requirement: Mock/dev source switchable

The system MUST run with a local mock source (key-less) and SHALL switch to API-Football without changing the UI layer.

- GIVEN no API key configured → WHEN the app starts → the mock source serves reads, UI renders identically.
- GIVEN an API key configured → WHEN the app starts → API-Football serves reads.

### Requirement: Boundary validation with Zod

Every source response MUST be validated at the infrastructure boundary against a Zod schema before entering domain logic; invalid data MUST fail fast with a typed error.

#### Scenario: Invalid payload
- GIVEN a source returns a malformed payload → WHEN the boundary parses it → it is rejected AND a typed error surfaces so the UI shows an error state.

### Requirement: API key hygiene

The API key MUST come from environment and MUST NOT be bundled into client-facing code.

- GIVEN a production build → WHEN the bundle is inspected → no API key literal is present.

### Requirement: Responsive team grid

The team grid MUST reflow across mobile, tablet, and desktop breakpoints.

- GIVEN the grid at mobile width → WHEN the viewport grows to tablet then desktop → the column count increases without overlap and labels stay readable.

## Technical Constraints

Must satisfy the project quality standard: server state to TanStack Query, UI state to useState, global state to Zustand; adapter and cache in `infrastructure/`, Zod at the boundary, `domain/` I/O-free; strict TS; one responsibility per function; typed errors; DI behind an interface; presentational components via props/hooks; explicit loading/error/empty states.