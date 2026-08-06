/**
 * App composition root (guía §8: pages orchestrate, hooks connect, components
 * render). Owns the grid→select→panel flow: teams from useTeams, the selected
 * team from the Zustand store, the prediction from usePrediction. Server data
 * never lives in local state — every selector reads from a hook.
 */
import type { FootballUseCases } from '../application/useCases'
import { useTeamSelection } from '../store/teamSelection'
import { NextMatchCard } from '../ui/NextMatchCard'
import { PredictionPanel } from '../ui/PredictionPanel'
import { TeamGrid } from '../ui/TeamGrid'
import { usePrediction } from '../ui/hooks/usePrediction'
import { useTeams } from '../ui/hooks/useTeams'

export interface AppProps {
  useCases: FootballUseCases
}

export function App({ useCases }: AppProps): React.JSX.Element {
  const teams = useTeams(useCases)
  const selectedTeamId = useTeamSelection((state) => state.selectedTeamId)
  const selectTeam = useTeamSelection((state) => state.selectTeam)
  const prediction = usePrediction(selectedTeamId, useCases)
  const hasSelection = selectedTeamId !== null

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
    </main>
  )
}