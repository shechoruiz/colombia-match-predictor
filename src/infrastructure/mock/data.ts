/**
 * Hand-written mock dataset standing in for API-Football league 239 (Liga
 * BetPlay DIMAYOR) when no API key is configured. Fixtures carry round naming
 * ("Apertura · Jornada N" / "Clausura · Jornada N") mirroring the real API, so
 * a key-less run still exercises the same shapes the UI renders.
 */
import type { Fixture, Team } from '../../domain/football/model'

export const MOCK_LEAGUE = {
  id: '239',
  name: 'Liga BetPlay DIMAYOR',
  tournaments: ['Apertura', 'Clausura'],
} as const

export const MOCK_TEAMS: Team[] = [
  { id: '2901', name: 'América de Cali', crestUrl: null },
  { id: '2893', name: 'Atlético Nacional', crestUrl: null },
  { id: '2909', name: 'Deportivo Pasto', crestUrl: null },
  { id: '2902', name: 'Junior', crestUrl: null },
  { id: '2908', name: 'La Equidad', crestUrl: null },
  { id: '2900', name: 'Millonarios', crestUrl: null },
  { id: '2906', name: 'Once Caldas', crestUrl: null },
  { id: '2905', name: 'Santa Fe', crestUrl: null },
]

export interface MockFixtureRecord {
  fixture: Fixture
  homeTeamId: string
  awayTeamId: string
  round: string
  homeGoals: number | null
  awayGoals: number | null
}

export const MOCK_FIXTURES: MockFixtureRecord[] = [
  // Apertura — already finished, feeds recent results.
  {
    fixture: { id: '6001', home: 'Atlético Nacional', away: 'Millonarios', kickoffUtc: '2026-07-12T23:00:00Z', status: 'FINISHED' },
    homeTeamId: '2893',
    awayTeamId: '2900',
    round: 'Apertura · Jornada 1',
    homeGoals: 2,
    awayGoals: 1,
  },
  {
    fixture: { id: '6002', home: 'América de Cali', away: 'Junior', kickoffUtc: '2026-07-13T21:00:00Z', status: 'FINISHED' },
    homeTeamId: '2901',
    awayTeamId: '2902',
    round: 'Apertura · Jornada 1',
    homeGoals: 0,
    awayGoals: 0,
  },
  {
    fixture: { id: '6003', home: 'Millonarios', away: 'América de Cali', kickoffUtc: '2026-07-19T23:00:00Z', status: 'FINISHED' },
    homeTeamId: '2900',
    awayTeamId: '2901',
    round: 'Apertura · Jornada 2',
    homeGoals: 3,
    awayGoals: 1,
  },
  {
    fixture: { id: '6005', home: 'La Equidad', away: 'Deportivo Pasto', kickoffUtc: '2026-07-11T20:00:00Z', status: 'FINISHED' },
    homeTeamId: '2908',
    awayTeamId: '2909',
    round: 'Apertura · Jornada 1',
    homeGoals: 1,
    awayGoals: 1,
  },
  // Clausura — scheduled, for next fixtures.
  {
    fixture: { id: '6101', home: 'Millonarios', away: 'Atlético Nacional', kickoffUtc: '2026-08-15T22:00:00Z', status: 'SCHEDULED' },
    homeTeamId: '2900',
    awayTeamId: '2893',
    round: 'Clausura · Jornada 1',
    homeGoals: null,
    awayGoals: null,
  },
  {
    fixture: { id: '6102', home: 'Junior', away: 'América de Cali', kickoffUtc: '2026-08-15T23:30:00Z', status: 'TIMED' },
    homeTeamId: '2902',
    awayTeamId: '2901',
    round: 'Clausura · Jornada 1',
    homeGoals: null,
    awayGoals: null,
  },
  {
    fixture: { id: '6103', home: 'Santa Fe', away: 'Once Caldas', kickoffUtc: '2026-08-16T20:00:00Z', status: 'SCHEDULED' },
    homeTeamId: '2905',
    awayTeamId: '2906',
    round: 'Clausura · Jornada 1',
    homeGoals: null,
    awayGoals: null,
  },
]