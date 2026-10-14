import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import { AZDefaultInstantiatedConditionBuilder } from './AZDefaultInstantiatedConditionBuilder'
import type { AZInstantiation } from './AZInstantiation'
import type { AZInstantiatedConditionBuilder } from './AZInstantiatedConditionBuilder'
import type { AZProduction } from './AZProduction'
import type { AZProductionNode } from './AZProductionNode'
import type { AZReteParentResolver } from './AZReteParentResolver'
import type { AZToken } from './AZToken'

export class AZInstantiationCreator {
  private nextInstantiationId = 1

  private readonly instantiatedConditionBuilder:
    AZInstantiatedConditionBuilder

  public constructor(
    reteParentResolver:
      AZReteParentResolver,
  ) {
    this.instantiatedConditionBuilder =
      new AZDefaultInstantiatedConditionBuilder(
        reteParentResolver,
      )
  }

  public create(
    production: AZProduction,
    productionNode: AZProductionNode,
    token: AZToken | null,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchGoal: AZSymbol | null,
    matchGoalLevel: number,
  ): AZInstantiation {
    const instantiatedConditions =
      this.instantiatedConditionBuilder.build(
        production,
        productionNode,
        token,
        workingMemoryElement,
      )

    const instantiation:
      AZInstantiation = {
        id: this.nextInstantiationId,
        production,
        instantiatedConditions,
        matchGoal,
        matchGoalLevel,
        inMatchSet: true,
        generatedPreferences: [],
        reteToken: token,
        reteWme: workingMemoryElement,
      }

    this.nextInstantiationId += 1

    return instantiation
  }
}
