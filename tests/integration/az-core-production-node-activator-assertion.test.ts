import assert from 'node:assert/strict'

import { AZDefaultProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZDefaultProductionNodeActivator'
import type { AZInstantiationRematchMatcher } from '../../src/engines/cognitive/az/core/production/AZInstantiationRematchMatcher'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionAssertionTypeResolver } from '../../src/engines/cognitive/az/core/production/AZProductionAssertionTypeResolver'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZReteMatchGoalResolver } from '../../src/engines/cognitive/az/core/production/AZReteMatchGoalResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const goal = symbol('S')

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: goal,
  attribute: symbol('A'),
  value: symbol('V'),
  acceptable: false,
}

const production: AZProduction = {
  name: 'activation-assertion-test',
  declaredSupport: 'O_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
}

const node: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 1,
  parent: null,
  children: [],
  production,
  tokens: [],
}

const parentToken: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const rematchMatcher: AZInstantiationRematchMatcher = {
  matches: () => false,
}

let goalResolverCalls = 0

const matchGoalResolver: AZReteMatchGoalResolver = {
  resolve: (
    token,
    workingMemoryElement,
  ) => {
    goalResolverCalls += 1

    assert.equal(token, parentToken)
    assert.equal(workingMemoryElement, wme)

    return {
      goal,
      level: 3,
    }
  },
}

let assertionTypeResolverCalls = 0

const assertionTypeResolver:
  AZProductionAssertionTypeResolver = {
    resolve: (
      productionNode,
      token,
      workingMemoryElement,
    ) => {
      assertionTypeResolverCalls += 1

      assert.equal(productionNode, node)
      assert.equal(token, parentToken)
      assert.equal(workingMemoryElement, wme)

      return 'O_ASSERTION'
    },
  }

const matchSet = new AZMatchSet()

const activator =
  new AZDefaultProductionNodeActivator(
    rematchMatcher,
    matchGoalResolver,
    assertionTypeResolver,
  )

const token = activator.activate(
  node,
  parentToken,
  wme,
  matchSet,
)

assert.equal(goalResolverCalls, 1)
assert.equal(assertionTypeResolverCalls, 1)

assert.equal(
  matchSet.hasAssertion(
    'O_ASSERTION',
    goal,
  ),
  true,
)

assert.equal(token.node, node)
assert.equal(token.parent, parentToken)
assert.equal(token.workingMemoryElement, wme)

console.log(
  'AZ core production node assertion activation: OK',
)
