import type { AZPreference } from '../operator/AZPreference'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalPreferenceRegistry } from './AZGoalPreferenceRegistry'

export class AZDefaultGoalPreferenceRegistry
  implements AZGoalPreferenceRegistry
{
  private readonly preferences =
    new Map<AZSymbol, AZPreference[]>()

  public add(
    goal: AZSymbol,
    preferences: readonly AZPreference[],
  ): void {
    let target =
      this.preferences.get(goal)

    if (target === undefined) {
      target = []
      this.preferences.set(goal, target)
    }

    for (const preference of preferences) {
      if (!target.includes(preference)) {
        target.unshift(preference)
      }
    }
  }

  public get(
    goal: AZSymbol,
  ): readonly AZPreference[] {
    return this.preferences.get(goal) ?? []
  }

  public remove(
    goal: AZSymbol,
    preference: AZPreference,
  ): void {
    const target =
      this.preferences.get(goal)

    if (target === undefined) {
      return
    }

    const index =
      target.indexOf(preference)

    if (index >= 0) {
      target.splice(index, 1)
    }

    if (target.length === 0) {
      this.preferences.delete(goal)
    }
  }

  public clear(
    goal: AZSymbol,
  ): void {
    this.preferences.delete(goal)
  }
}
