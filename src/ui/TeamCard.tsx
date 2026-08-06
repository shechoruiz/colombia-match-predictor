/**
 * Presentational team cell (guía §8: pure components take props, the hook
 * lives outside). Shows the crest image when available, a placeholder
 * otherwise, plus the team name. The click always reports the team id via
 * `onSelect` — the parent decides what selection means.
 */
import type { Team } from '../domain/football/model'

export interface TeamCardProps {
  team: Team
  onSelect: (teamId: string) => void
}

export function TeamCard({ team, onSelect }: TeamCardProps): React.JSX.Element {
  const crestLabel = `Escudo de ${team.name}`
  return (
    <button
      type="button"
      onClick={() => onSelect(team.id)}
      className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-400 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {team.crestUrl !== null ? (
        <img src={team.crestUrl} alt={crestLabel} className="h-16 w-16 object-contain" />
      ) : (
        <span
          aria-label="Escudo no disponible"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-2xl font-bold text-neutral-400"
        >
          {team.name.charAt(0)}
        </span>
      )}
      <span className="text-center text-sm font-medium text-neutral-800">{team.name}</span>
    </button>
  )
}