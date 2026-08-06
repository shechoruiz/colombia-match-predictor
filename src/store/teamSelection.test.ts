/**
 * Component tests for the global team-selection store (guía §6: global state
 * lives in Zustand — only the selected team id is global, nothing else).
 */
import { describe, expect, it } from 'vitest'
import { useTeamSelection } from './teamSelection'

describe('useTeamSelection', () => {
  it('starts with no team selected', () => {
    expect(useTeamSelection.getState().selectedTeamId).toBeNull()
  })

  it('stores the selected team id', () => {
    useTeamSelection.getState().selectTeam('2893')
    expect(useTeamSelection.getState().selectedTeamId).toBe('2893')
  })

  it('allows clearing the selection back to null', () => {
    useTeamSelection.getState().selectTeam('2893')
    useTeamSelection.getState().selectTeam(null)
    expect(useTeamSelection.getState().selectedTeamId).toBeNull()
  })
})
