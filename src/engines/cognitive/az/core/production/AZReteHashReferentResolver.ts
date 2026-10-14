import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZToken } from './AZToken'
import type { AZVariableLocation } from './AZVariableLocation'

export interface AZReteHashReferentResolver {
  resolve(
    parentToken: AZToken | null,
    currentWme: AZWorkingMemoryElement | null,
    location: AZVariableLocation,
  ): AZSymbol
}
