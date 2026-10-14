import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZInstantiationRematchMatcher } from './AZInstantiationRematchMatcher'
import type { AZMatchSet } from './AZMatchSet'
import type { AZProductionAssertionTypeResolver } from './AZProductionAssertionTypeResolver'
import type { AZProductionNode } from './AZProductionNode'
import type { AZProductionNodeActivator } from './AZProductionNodeActivator'
import type { AZReteMatchGoalResolver } from './AZReteMatchGoalResolver'
import type { AZToken } from './AZToken'

export class AZDefaultProductionNodeActivator
  implements AZProductionNodeActivator
{
  public constructor(
    private readonly rematchMatcher:
      AZInstantiationRematchMatcher,
    private readonly matchGoalResolver:
      AZReteMatchGoalResolver,
    private readonly assertionTypeResolver:
      AZProductionAssertionTypeResolver,
  ) {}

  public activate(
    node: AZProductionNode,
    parentToken: AZToken,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken {
    const token: AZToken = {
      parent: parentToken,
      workingMemoryElement,
      node,
      hashReferent: null,
      negativeMatches: [],
      children: [],
    }

    node.tokens.push(token)
    parentToken.children.push(token)

    const rematchedInstantiation =
      matchSet.cancelRetraction(
        node,
        instantiation =>
          this.rematchMatcher.matches(
            instantiation,
            node,
            parentToken,
            workingMemoryElement,
          ),
      )

    if (rematchedInstantiation !== null) {
      rematchedInstantiation.reteToken =
        parentToken

      rematchedInstantiation.reteWme =
        workingMemoryElement

      return token
    }

    const matchGoal =
      this.matchGoalResolver.resolve(
        parentToken,
        workingMemoryElement,
      )

    const assertionType =
      this.assertionTypeResolver.resolve(
        node,
        parentToken,
        workingMemoryElement,
      )

    matchSet.addAssertion({
      type: assertionType,
      production: node.production,
      token,
      wme: workingMemoryElement,
      matchGoal: matchGoal.goal,
      matchGoalLevel: matchGoal.level,
    })

    return token
  }
}
