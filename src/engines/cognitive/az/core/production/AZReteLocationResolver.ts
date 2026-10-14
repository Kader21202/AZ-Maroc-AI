import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZToken } from './AZToken'
import type { AZReteFieldNumber } from './AZVariableLocation'

export interface AZReteLocationResolver {
  resolve(
    token: AZToken,
    currentWme: AZWorkingMemoryElement | null,
    levelsUp: number,
    fieldNumber: AZReteFieldNumber,
  ): AZSymbol
}
