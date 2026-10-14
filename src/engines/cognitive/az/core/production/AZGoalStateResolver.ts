import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZGoalStateResolver {
  isGoal(symbol: AZSymbol): boolean

  getLevel(symbol: AZSymbol): number
}
