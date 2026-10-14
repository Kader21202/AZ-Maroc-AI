import type { AZPreference } from '../operator/AZPreference'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZProduction } from './AZProduction'
import type { AZInstantiatedCondition } from './AZInstantiatedCondition'
import type { AZToken } from './AZToken'

export interface AZInstantiation {
  readonly id: number
  readonly production: AZProduction | null
  readonly instantiatedConditions: readonly AZInstantiatedCondition[]
  readonly matchGoal: AZSymbol | null
  readonly matchGoalLevel: number
  inMatchSet: boolean
  readonly generatedPreferences: AZPreference[]

  reteToken: AZToken | null
  reteWme: AZWorkingMemoryElement | null
}
