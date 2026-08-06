/**
 * App composition root (guía §8: pages orchestrate, hooks connect, components
 * render). Owns the grid→select→panel flow: teams from useTeams, the selected
 * team from the Zustand store, the prediction from usePrediction. Server data
 * never lives in local state — every selector reads from a hook.
 */
import type { FootballUseCases } from '../application/useCases'
import type { HistoryUseCases } from '../application/historyUseCase'
import { useEffect } from 'react'
import { useTeamSelection } from '../store/teamSelection'
import { HistorySection } from '../ui/HistorySection'
import { NextMatchCard } from '../ui/NextMatchCard'
import { PredictionPanel } from '../ui/PredictionPanel'
import { TeamGrid } from '../ui/TeamGrid'
import { useHistory } from '../ui/hooks/useHistory'
import { usePrediction } from '../ui/hooks/usePrediction'
import { useTeams } from '../ui/hooks/useTeams'

export interface AppProps {
  useCases: FootballUseCases
  history: HistoryUseCases
}

export function App({ useCases, history }: AppProps): React.JSX.Element {
  const teams = useTeams(useCases)
  const selectedTeamId = useTeamSelection((state) => state.selectedTeamId)
  const selectTeam = useTeamSelection((state) => state.selectTeam)
  const prediction = usePrediction(selectedTeamId, useCases)
  const historyState = useHistory(selectedTeamId, history)
  const hasSelection = selectedTeamId !== null

  // Record the produced prediction so the history panel can validate it later
  // against the real result (spec prediction-history: "WHEN the prediction is
  // rendered THEN a record is persisted"). Dedupe by fixture id makes this
  // idempotent across re-renders.
  useEffect(() => {
    const fixture = prediction.nextFixture
    const produced = prediction.prediction
    if (fixture === null || produced === null) return
    historyState.recordPrediction({
      fixtureId: fixture.id,
      home: fixture.home,
      away: fixture.away,
      kickoffUtc: fixture.kickoffUtc,
      predictedOutcome: produced.outcome,
    })
  }, [prediction.nextFixture, prediction.prediction, historyState.recordPrediction])

  return (
    <main className="mx-auto max-w-5xl min-h-screen bg-neutral-50 px-4 py-6 text-neutral-900">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Colombia Match Predictor</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Liga BetPlay DIMAYOR — selecciona un equipo para ver su próxima predicción.
        </p>
      </header>

      <TeamGrid
        teams={teams.teams}
        isLoading={teams.isLoading}
        isError={teams.isError}
        onRetry={teams.refetch}
        onSelect={selectTeam}
      />

      {Boolean(hasSelection) && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <NextMatchCard
            fixture={prediction.nextFixture}
            isLoading={prediction.isLoading}
            isError={prediction.isError}
            onRetry={prediction.refetch}
          />
        </section>
      )}

      <section className={Boolean(hasSelection) ? 'mt-8 grid gap-6 lg:grid-cols-2' : 'mt-8'}>
        <PredictionPanel
          prediction={prediction.prediction}
          homeName={prediction.homeName}
          awayName={prediction.awayName}
          isLoading={prediction.isLoading}
          isError={prediction.isError}
          onRetry={prediction.refetch}
        />
      </section>

      <section className="mt-8">
        <HistorySection
          records={historyState.records}
          summary={historyState.summary}
          isLoading={historyState.isLoading}
          isError={historyState.isError}
          onRetry={historyState.refetch}
        />
      </section>
    </main>
  )
}