/**
 * Presentational responsive team grid (spec fixtures-data: 2/4/6 columns on
 * mobile/tablet/desktop). Every state is explicit — loading skeleton, error
 * with retry, empty catalog, or the team cells themselves. Server state never
 * lives here: the parent passes `teams`/`isLoading`/`isError` from a hook.
 */
import type { Team } from '../domain/football/model'
import { TeamCard } from './TeamCard'

export interface TeamGridProps {
  teams: Team[] | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (teamId: string) => void
}

export function TeamGrid({
  teams,
  isLoading,
  isError,
  onRetry,
  onSelect,
}: TeamGridProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div aria-label="Cargando equipos" className="animate-pulse">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-28 rounded-xl border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-800">
          No se pudo cargar el catálogo de equipos.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (teams === null || teams.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
        No hay equipos disponibles.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} onSelect={onSelect} />
      ))}
    </div>
  )
}