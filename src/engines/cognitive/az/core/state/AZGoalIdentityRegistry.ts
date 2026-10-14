import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZGoalIdentityRegistry {
  isGoal(symbol: AZSymbol): boolean

  getLevel(symbol: AZSymbol): number

  registerGoal(
    symbol: AZSymbol,
    level: number,
  ): void
}
