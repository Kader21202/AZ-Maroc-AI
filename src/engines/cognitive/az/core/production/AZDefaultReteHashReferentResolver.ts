import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import { getAZReteWmeField } from './AZReteWmeField'
import type { AZReteHashReferentResolver } from './AZReteHashReferentResolver'
import type { AZToken } from './AZToken'
import type { AZVariableLocation } from './AZVariableLocation'

export class AZDefaultReteHashReferentResolver
  implements AZReteHashReferentResolver
{
  public resolve(
    parentToken: AZToken | null,
    currentWme: AZWorkingMemoryElement | null,
    location: AZVariableLocation,
  ): AZSymbol {
    if (location.levelsUp < 1) {
      throw new Error(
        'AZ RETE hash location levelsUp must be at least 1',
      )
    }

    if (location.levelsUp === 1) {
      if (currentWme === null) {
        throw new Error(
          'AZ RETE hash referent requires current WME for levelsUp 1',
        )
      }

      return getAZReteWmeField(
        currentWme,
        location.fieldNumber,
      )
    }

    let token = parentToken
    let remaining = location.levelsUp - 2

    if (token === null) {
      throw new Error(
        'AZ RETE hash location exceeds token ancestry',
      )
    }

    while (remaining > 0) {
      token = token.parent

      if (token === null) {
        throw new Error(
          'AZ RETE hash location exceeds token ancestry',
        )
      }

      remaining -= 1
    }

    const wme = token.workingMemoryElement

    if (wme === null) {
      throw new Error(
        'AZ RETE hash referent token has no working-memory element',
      )
    }

    return getAZReteWmeField(
      wme,
      location.fieldNumber,
    )
  }
}
