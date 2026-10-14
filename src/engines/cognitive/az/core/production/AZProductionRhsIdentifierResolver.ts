import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZProductionRhsValue } from './AZProductionRhsValue'
import type { AZToken } from './AZToken'

export interface AZProductionRhsIdentifierResolver {
  resolve(
    value: AZProductionRhsValue,
    token: AZToken,
    currentWme: AZWorkingMemoryElement,
  ): AZSymbol | null
}
