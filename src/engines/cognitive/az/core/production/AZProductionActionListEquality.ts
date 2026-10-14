import { isAZBinaryPreferenceType } from '../operator/AZPreferenceTypeSemantics'
import type { AZProductionAction } from './AZProductionAction'
import type { AZRhsValueEquality } from './AZRhsValueEquality'

export interface AZProductionActionListEquality {
  equals(
    left: readonly AZProductionAction[],
    right: readonly AZProductionAction[],
  ): boolean
}

export class AZDefaultProductionActionListEquality
  implements AZProductionActionListEquality
{
  public constructor(
    private readonly rhsValueEquality:
      AZRhsValueEquality,
  ) {}

  public equals(
    left: readonly AZProductionAction[],
    right: readonly AZProductionAction[],
  ): boolean {
    let index = 0

    while (
      index < left.length &&
      index < right.length
    ) {
      const leftAction =
        left[index]

      const rightAction =
        right[index]

      if (
        leftAction === undefined ||
        rightAction === undefined
      ) {
        return false
      }

      if (
        leftAction.type === 'FUNCALL'
      ) {
        if (
          rightAction.type !==
          'FUNCALL'
        ) {
          return false
        }

        return this.rhsValueEquality
          .equals(
            leftAction.functionCall,
            rightAction.functionCall,
          )
      }

      if (
        rightAction.type !== 'MAKE'
      ) {
        return false
      }

      if (
        leftAction.preferenceType !==
        rightAction.preferenceType
      ) {
        return false
      }

      if (
        !this.rhsValueEquality.equals(
          leftAction.identifier,
          rightAction.identifier,
        )
      ) {
        return false
      }

      if (
        !this.rhsValueEquality.equals(
          leftAction.attribute,
          rightAction.attribute,
        )
      ) {
        return false
      }

      if (
        !this.rhsValueEquality.equals(
          leftAction.value,
          rightAction.value,
        )
      ) {
        return false
      }

      if (
        isAZBinaryPreferenceType(
          leftAction.preferenceType,
        )
      ) {
        if (
          leftAction.referent ===
            undefined ||
          rightAction.referent ===
            undefined
        ) {
          return false
        }

        if (
          !this.rhsValueEquality.equals(
            leftAction.referent,
            rightAction.referent,
          )
        ) {
          return false
        }
      }

      index += 1
    }

    return (
      index === left.length &&
      index === right.length
    )
  }
}
