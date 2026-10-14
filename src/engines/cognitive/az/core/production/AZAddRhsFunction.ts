import type { AZRhsFunction } from './AZRhsFunction'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'

export class AZAddRhsFunction
  implements AZRhsFunction
{
  public readonly numArgsExpected = -1
  public readonly canBeRhsValue = true
  public readonly canBeStandaloneAction = false

  public constructor(
    private readonly symbolManager:
      AZSymbolManager,
  ) {}

  public execute(
    arguments_: readonly AZSymbol[],
  ): AZSymbol | null {
    let result = 0
    let hasFloat = false

    for (const argument of arguments_) {
      if (
        argument.type !== 'INTEGER_CONSTANT' &&
        argument.type !== 'FLOAT_CONSTANT'
      ) {
        return null
      }

      if (typeof argument.value !== 'number') {
        return null
      }

      if (argument.type === 'FLOAT_CONSTANT') {
        hasFloat = true
      }

      result += argument.value
    }

    return hasFloat
      ? this.symbolManager.makeFloatConstant(result)
      : this.symbolManager.makeIntegerConstant(result)
  }
}
