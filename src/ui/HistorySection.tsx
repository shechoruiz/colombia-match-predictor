/**
 * Presentational history section (spec prediction-history: hit/miss/pending
 * badges, aggregate H/(H+M), loading/error/empty states, responsive). Pure
 * props — the hook computes records + summary and hands them in; no fetch or
 * storage here. The aggregate excludes pending records from the window.
 */
import type { HistorySummary } from '../domain/history/reconcile'
import type { PredictionRecord } from '../domain/football/model'
import type { HistoryStatus } from '../domain/football/model'

export interface HistorySectionProps {
  records: PredictionRecord[]
  summary: HistorySummary
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const BADGE_LABELS: Record<HistoryStatus, string> = {
  hit: 'Acertada',
  miss: 'Fallada',
  pending: 'Pendiente',
}

const BADGE_CLASSES: Record<HistoryStatus, string> = {
  hit: 'bg-green-100 text-green-800',
  miss: 'bg-red-100 text-red-800',
  pending: 'bg-neutral-100 text-neutral-600',
}

function badgeClass(status: HistoryStatus): string {
  return BADGE_CLASSES[status]
}

export function HistorySection({
  records,
  summary,
  isLoading,
  isError,
  onRetry,
}: HistorySectionProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div aria-label="Cargando historial" className="animate-pulse">
        <div className="h-28 rounded-xl border border-neutral-200 bg-neutral-100" />
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-800">No se pudo cargar el historial.</p>
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

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Historial de predicciones
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Todavía no hay predicciones. Haz tu primera predicción para empezar a validar tus
          aciertos.
        </p>
      </div>
    )
  }

  return (
    <section
      aria-label="Historial de predicciones"
      className="rounded-xl border border-neutral-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Historial de predicciones
        </h2>
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-neutral-900">
            {summary.hits}/{summary.window}
          </span>{' '}
          acertadas
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {records.map((record) => (
          <li key={record.fixtureId} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-neutral-700">
              {record.home} vs {record.away}
            </span>
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeClass(record.status)}`}>
              {BADGE_LABELS[record.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}