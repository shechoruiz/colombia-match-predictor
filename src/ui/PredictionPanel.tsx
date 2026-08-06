/**
 * Presentational prediction panel (spec match-prediction: probability bars,
 * scoreline, natural Spanish outcome + one-to-two-sentence rationale; loading,
 * error+retry, empty states). Pure props: the hook computes the Prediction and
 * hands it in; the panel only renders it, reusing the domain Spanish labels.
 */
import type { Prediction } from '../domain/football/model'
import { formatOutcomeLabel } from '../domain/prediction/language'

export interface PredictionPanelProps {
  prediction: Prediction | null
  homeName: string
  awayName: string
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

interface OutcomeRow {
  visibleLabel: string
  accessibleLabel: string
  percent: number
}

function toPercent(probability: number): number {
  return Math.round(probability * 100)
}

export function PredictionPanel({
  prediction,
  homeName,
  awayName,
  isLoading,
  isError,
  onRetry,
}: PredictionPanelProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div
        aria-label="Calculando predicción"
        className="h-40 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
      />
    )
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-800">No se pudo calcular la predicción.</p>
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

  if (prediction === null) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
        Selecciona un equipo para ver su predicción.
      </p>
    )
  }

  const rows: OutcomeRow[] = [
    {
      visibleLabel: 'Local',
      accessibleLabel: `Probabilidad local ${toPercent(prediction.probabilities.home)}%`,
      percent: toPercent(prediction.probabilities.home),
    },
    {
      visibleLabel: 'Empate',
      accessibleLabel: `Probabilidad empate ${toPercent(prediction.probabilities.draw)}%`,
      percent: toPercent(prediction.probabilities.draw),
    },
    {
      visibleLabel: 'Visitante',
      accessibleLabel: `Probabilidad visitante ${toPercent(prediction.probabilities.away)}%`,
      percent: toPercent(prediction.probabilities.away),
    },
  ]

  return (
    <section aria-label="Predicción" className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Predicción del modelo
      </h2>
      <p className="mt-2 text-lg font-bold text-neutral-900">
        {formatOutcomeLabel({
          outcome: prediction.outcome,
          homeName,
          awayName,
          probability: Math.max(
            prediction.probabilities.home,
            prediction.probabilities.draw,
            prediction.probabilities.away,
          ),
        })}
      </p>

      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.visibleLabel} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-sm text-neutral-700">{row.visibleLabel}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                role="progressbar"
                aria-label={row.accessibleLabel}
                aria-valuenow={row.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${row.percent}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-semibold text-neutral-800">
              {row.percent}%
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
        Marcador: {prediction.predictedScore.home} - {prediction.predictedScore.away}
      </p>
      <p className="mt-1 text-sm text-neutral-600">{prediction.rationale}</p>
    </section>
  )
}