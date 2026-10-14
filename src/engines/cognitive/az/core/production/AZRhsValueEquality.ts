import type { AZProductionRhsValue } from './AZProductionRhsValue'

export interface AZRhsValueEquality {
  equals(
    left: AZProductionRhsValue,
    right: AZProductionRhsValue,
  ): boolean
}

export class AZDefaultRhsValueEquality
  implements AZRhsValueEquality
{
  public equals(
    left: AZProductionRhsValue,
    right: AZProductionRhsValue,
  ): boolean {
    if (
      left.type === 'SYMBOL' &&
      right.type === 'SYMBOL'
    ) {
      return left.symbol === right.symbol
    }

    if (
      left.type === 'FUNCALL' &&
      right.type === 'FUNCALL'
    ) {
      if (
        left.functionName !==
        right.functionName
      ) {
        return false
      }

      const commonLength =
        Math.min(
          left.arguments.length,
          right.arguments.length,
        )

      for (
        let index = 0;
        index < commonLength;
        index += 1
      ) {
        const leftArgument =
          left.arguments[index]

        const rightArgument =
          right.arguments[index]

        if (
          leftArgument === undefined ||
          rightArgument === undefined
        ) {
          return false
        }

        if (
          !this.equals(
            leftArgument,
            rightArgument,
          )
        ) {
          return false
        }
      }

      return true
    }

    if (left.type !== right.type) {
      return false
    }

    switch (left.type) {
      case 'RETE_LOCATION':
        return (
          right.type === 'RETE_LOCATION' &&
          left.fieldNumber ===
            right.fieldNumber &&
          left.levelsUp ===
            right.levelsUp
        )

      case 'UNBOUND_VARIABLE':
        return (
          right.type ===
            'UNBOUND_VARIABLE' &&
          left.index === right.index
        )

      case 'SYMBOL':
      case 'FUNCALL':
        return false
    }
  }
}
