import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZInstantiationRematchMatcher } from '../../src/engines/cognitive/az/core/production/AZInstantiationRematchMatcher'
import type { AZMatchAssertionType, AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZProductionAssertionTypeResolver } from '../../src/engines/cognitive/az/core/production/AZProductionAssertionTypeResolver'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZProductionNodeActivator'
import type { AZReteMatchGoal, AZReteMatchGoalResolver } from '../../src/engines/cognitive/az/core/production/AZReteMatchGoalResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

class TestRematchMatcher
  implements AZInstantiationRematchMatcher
{
  public matches(
    _instantiation: AZInstantiation,
    _productionNode: AZProductionNode,
    _token: AZToken | null,
    _workingMemoryElement: AZWorkingMemoryElement | null,
  ): boolean {
    return false
  }
}

class TestMatchGoalResolver
  implements AZReteMatchGoalResolver
{
  public resolve(
    token: AZToken,
    _workingMemoryElement: AZWorkingMemoryElement | null,
  ): AZReteMatchGoal {
    if (token.workingMemoryElement === null) {
      throw new Error('Test token has no WME')
    }

    return {
      goal: token.workingMemoryElement.identifier,
      level: 1,
    }
  }
}

class TestAssertionTypeResolver
  implements AZProductionAssertionTypeResolver
{
  public resolve(
    _productionNode: AZProductionNode,
    _parentToken: AZToken,
    _workingMemoryElement: AZWorkingMemoryElement | null,
  ): AZMatchAssertionType {
    return 'I_ASSERTION'
  }
}

class TestProductionNodeActivator
  implements AZProductionNodeActivator
{
  public activate(
    node: AZProductionNode,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
    _matchSet: AZMatchSet,
  ): AZToken {
    return {
      parent: parentToken,
      workingMemoryElement,
      node,
      hashReferent: null,
      negativeMatches: [],
      children: [],
    }
  }
}

void TestRematchMatcher
void TestMatchGoalResolver
void TestAssertionTypeResolver
void TestProductionNodeActivator

console.log(
  'AZ core production activation contracts: OK',
)
