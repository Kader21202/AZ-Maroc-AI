import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZReteLocationResolver } from './AZReteLocationResolver'
import type { AZToken } from './AZToken'
import type { AZReteFieldNumber } from './AZVariableLocation'
import { getAZReteWmeField } from './AZReteWmeField'

export class AZDefaultReteLocationResolver
  implements AZReteLocationResolver
{
  public resolve(
    token: AZToken,
    currentWme: AZWorkingMemoryElement | null,
    levelsUp: number,
    fieldNumber: AZReteFieldNumber,
  ): AZSymbol {
    if (levelsUp < 0) {
      throw new Error(
        'Rete location levelsUp cannot be negative',
      )
    }

    if (levelsUp === 0) {
      if (currentWme === null) {
        throw new Error(
          'Rete location at current level requires working-memory element',
        )
      }

      return getAZReteWmeField(
        currentWme,
        fieldNumber,
      )
    }

    let currentToken: AZToken | null = token
    let remaining = levelsUp - 1

    while (remaining > 0) {
      currentToken = currentToken.parent

      if (currentToken === null) {
        throw new Error(
          'Rete location exceeds token ancestry',
        )
      }

      remaining -= 1
    }

    const wme =
      currentToken.workingMemoryElement

    if (wme === null) {
      throw new Error(
        'Rete location token has no working-memory element',
      )
    }

    return getAZReteWmeField(
      wme,
      fieldNumber,
    )
  }
}
