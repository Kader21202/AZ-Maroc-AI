import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZReteFieldNumber } from './AZVariableLocation'

export function getAZReteWmeField(
  wme: AZWorkingMemoryElement,
  fieldNumber: AZReteFieldNumber,
): AZSymbol {
  switch (fieldNumber) {
    case 0:
      return wme.identifier

    case 1:
      return wme.attribute

    case 2:
      return wme.value
  }
}
