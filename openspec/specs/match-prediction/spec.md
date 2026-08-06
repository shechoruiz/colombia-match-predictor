# match-prediction Specification

## Purpose

Produce a 1X2 match prediction (home win / draw / away win) with probabilities and a predicted scoreline from a pure, deterministic attack/defense Poisson + Elo model with home advantage, and present it in natural Spanish ("Gana Atlético Nacional (48%)").

## ADDED Requirements

### Requirement: Deterministic 1X2 probabilities

The system MUST compute 1X2 probabilities from team strengths (attack/defense, home/away), league average, Elo rating, and home advantage, and MUST be a pure function of its inputs (same inputs → same output).

#### Scenario: Probabilities sum to one
- GIVEN valid team-strength inputs
- WHEN the predictor runs
- THEN home/draw/away probabilities are returned
- AND they sum to 1 (within floating-point tolerance)

#### Scenario: Determinism
- GIVEN identical inputs twice
- WHEN the predictor runs each time
- THEN the outputs are identical

#### Scenario: Home advantage applied
- GIVEN two equal-strength teams
- WHEN the predictor runs
- THEN the home team's win probability exceeds the away team's

### Requirement: Predicted scoreline

The system MUST derive a most-likely scoreline (home goals, away goals) from the expected-goals output.

#### Scenario: Scoreline derived
- GIVEN valid expected-goal values
- WHEN the predictor runs
- THEN a home and away goal count is returned
- THEN the scoreline's 1X2 outcome matches the highest probability outcome

### Requirement: Natural-language Spanish outcome

The system MUST render the prediction in natural Spanish, not raw 1X2 notation, using the team names and probability (e.g., "Gana Atlético Nacional (48%)", "Empate", "Gana Junior").

#### Scenario: Spanish outcome strings
- GIVEN a prediction for a fixture
- WHEN the UI renders the outcome
- THEN the label is one of the natural Spanish forms with the highest-probability team name
- AND raw "1", "X", "2" notation is never shown

#### Scenario: Equal probabilities
- GIVEN two outcomes are equally likely (within tolerance)
- WHEN the UI renders the outcome
- THEN it does not claim a false winner; it presents the tie/empate or the two tied outcomes

### Requirement: Prediction requires complete inputs

The predictor MUST reject (fail fast, typed error) inputs missing required strengths or a fixture; the UI MUST show a loading, error, or empty state accordingly.

#### Scenario: Missing fixture
- GIVEN no fixture data is available for the selected team
- WHEN the prediction is requested
- THEN a typed error is raised and the UI shows an error or empty state
- THEN no fabricated probabilities are rendered

#### Scenario: Loading state
- GIVEN fixture or results data is being fetched
- WHEN the prediction panel renders
- THEN a loading state (skeleton/spinner) is shown

### Requirement: Explainable prediction

The system SHOULD present a short plain-Spanish rationale referencing the factors (form, home advantage, attack/defense) alongside the outcome.

#### Scenario: Rationale shown
- GIVEN a completed prediction
- WHEN the prediction panel renders
- THEN a one-to-two sentence Spanish rationale appears
- THEN the rationale references only factors that exist in the model inputs

### Requirement: Responsive prediction panel

The prediction panel MUST render correctly across mobile, tablet, and desktop widths.

#### Scenario: Panel reflow
- GIVEN a prediction panel at mobile width
- WHEN the viewport grows to desktop
- THEN the outcome, probabilities, and rationale remain readable with no horizontal overflow

## Technical Constraints

The predictor MUST be a pure, testable function in `src/domain/prediction/` with no I/O. It MUST satisfy the project quality standard (guia-practicas-esenciales): one responsibility per function, self-explanatory names, strict TS without `any`/`@ts-ignore`, typed errors, real DRY across the model. Multi-line fit-style untested model code is out of scope; the model is small, deterministic, and unit-tested.