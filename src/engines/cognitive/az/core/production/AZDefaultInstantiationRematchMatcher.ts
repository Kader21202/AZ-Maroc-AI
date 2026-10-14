import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZInstantiation } from './AZInstantiation'
import type { AZInstantiatedCondition } from './AZInstantiatedCondition'
import type { AZInstantiationRematchMatcher } from './AZInstantiationRematchMatcher'
import type { AZInstantiatedConditionBuilder } from './AZInstantiatedConditionBuilder'
import type { AZProductionNode } from './AZProductionNode'
import type { AZToken } from './AZToken'

export class AZDefaultInstantiationRematchMatcher
  implements AZInstantiationRematchMatcher
{
  public constructor(
    private readonly instantiatedConditionBuilder:
      AZInstantiatedConditionBuilder,
  ) {}

  public matches(
    instantiation: AZInstantiation,
    productionNode: AZProductionNode,
    token: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): boolean {
    if (
      productionNode.production !==
      instantiation.production
    ) {
      return false
    }

    if (instantiation.production === null) {
      return false
    }

    const candidateConditions =
      this.instantiatedConditionBuilder.build(
        instantiation.production,
        productionNode,
        token,
        workingMemoryElement,
      )

    return this.samePositiveWmes(
      instantiation.instantiatedConditions,
      candidateConditions,
    )
  }

  private samePositiveWmes(
    previous: readonly AZInstantiatedCondition[],
    candidate: readonly AZInstantiatedCondition[],
  ): boolean {
    if (previous.length !== candidate.length) {
      return false
    }

    for (
      let index = 0;
      index < previous.length;
      index += 1
    ) {
      const oldCondition = previous[index]
      const newCondition = candidate[index]

      if (
        oldCondition === undefined ||
        newCondition === undefined
      ) {
        return false
      }

      if (oldCondition.type === 'POSITIVE') {
        if (newCondition.type !== 'POSITIVE') {
          return false
        }

        if (
          oldCondition.workingMemoryElement !==
          newCondition.workingMemoryElement
        ) {
          return false
        }
      }
    }

    return true
  }
}
