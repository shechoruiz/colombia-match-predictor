/**
 * Global UI state (guía §6): the selected team id is shared by the grid and
 * the prediction panel, so it lives in Zustand. Nothing else is global — all
 * server data flows through TanStack Query and all local UI state through
 * useState. `null` means "no team selected yet".
 */
import { create } from 'zustand'

interface TeamSelectionState {
  selectedTeamId: string | null
  selectTeam: (teamId: string | null) => void
}

export const useTeamSelection = create<TeamSelectionState>((set) => ({
  selectedTeamId: null,
  selectTeam: (teamId) => set({ selectedTeamId: teamId }),
}))