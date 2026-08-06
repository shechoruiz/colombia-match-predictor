/**
 * Presentational next-fixture card (spec fixtures-data: home, away, Spanish
 * kickoff; explicit empty state when the team has no scheduled match). Pure
 * props; the parent decides what fixture to hand in via the hook.
 */
import type { Fixture } from '../domain/football/model'
import { formatKickoffSpanish } from './dates'

export interface NextMatchCardProps {
  fixture: Fixture | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function NextMatchCard({
  fixture,
  isLoading,
  isError,
  onRetry,
}: NextMatchCardProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div
        aria-label="Cargando próximo partido"
        className="h-28 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
      />
    )
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-800">No se pudo cargar el próximo partido.</p>
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

  if (fixture === null) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
        Sin próximo partido programado.
      </p>
    )
  }

  return (
    <section aria-label="Próximo partido" className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Próximo partido
      </h2>
      <p className="mt-2 text-lg font-bold text-neutral-900">
        {fixture.home} <span className="font-normal text-neutral-400">vs</span>{' '}
        {fixture.away}
      </p>
      <p className="mt-1 text-sm text-neutral-600">{formatKickoffSpanish(fixture.kickoffUtc)}</p>
    </section>
  )
}