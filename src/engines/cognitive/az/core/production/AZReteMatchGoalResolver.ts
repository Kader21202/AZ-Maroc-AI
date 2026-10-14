import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZToken } from './AZToken'

export interface AZReteMatchGoal {
  readonly goal: AZSymbol
  readonly level: number
}

export interface AZReteMatchGoalResolver {
  resolve(
    token: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): AZReteMatchGoal
}
