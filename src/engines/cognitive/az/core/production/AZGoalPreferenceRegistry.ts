import type { AZPreference } from '../operator/AZPreference'
import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZGoalPreferenceRegistry {
  add(
    goal: AZSymbol,
    preferences: readonly AZPreference[],
  ): void

  get(
    goal: AZSymbol,
  ): readonly AZPreference[]

  remove(
    goal: AZSymbol,
    preference: AZPreference,
  ): void

  clear(
    goal: AZSymbol,
  ): void
}
