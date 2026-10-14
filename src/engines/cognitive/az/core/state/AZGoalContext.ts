import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZGoalContext {
  readonly goal: AZSymbol

  higher: AZGoalContext | null
  lower: AZGoalContext | null
}
