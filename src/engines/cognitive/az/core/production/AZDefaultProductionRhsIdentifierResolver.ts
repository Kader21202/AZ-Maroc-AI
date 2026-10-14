import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import { AZDefaultReteLocationResolver } from './AZDefaultReteLocationResolver'
import type { AZProductionRhsIdentifierResolver } from './AZProductionRhsIdentifierResolver'
import type { AZProductionRhsValue } from './AZProductionRhsValue'
import type { AZReteLocationResolver } from './AZReteLocationResolver'
import type { AZToken } from './AZToken'
import type { AZReteFieldNumber } from './AZVariableLocation'

export class AZDefaultProductionRhsIdentifierResolver
  implements AZProductionRhsIdentifierResolver
{
  public constructor(
    private readonly reteLocationResolver:
      AZReteLocationResolver =
        new AZDefaultReteLocationResolver(),
  ) {}

  public resolve(
    value: AZProductionRhsValue,
    token: AZToken,
    currentWme: AZWorkingMemoryElement,
  ): AZSymbol | null {
    switch (value.type) {
      case 'SYMBOL':
        return value.symbol

      case 'UNBOUND_VARIABLE':
      case 'FUNCALL':
        return null

      case 'RETE_LOCATION':
        return this.reteLocationResolver.resolve(
          token,
          currentWme,
          value.levelsUp,
          this.requireFieldNumber(
            value.fieldNumber,
          ),
        )
    }
  }

  private requireFieldNumber(
    fieldNumber: number,
  ): AZReteFieldNumber {
    if (
      fieldNumber !== 0 &&
      fieldNumber !== 1 &&
      fieldNumber !== 2
    ) {
      throw new Error(
        `Invalid RETE field number: ${fieldNumber}`,
      )
    }

    return fieldNumber
  }
}
