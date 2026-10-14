import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZGoalStateRegistry {
  isGoal(symbol: AZSymbol): boolean

  getLevel(symbol: AZSymbol): number

  registerGoal(
    symbol: AZSymbol,
    level: number,
  ): void

  removeGoal(symbol: AZSymbol): void
}
