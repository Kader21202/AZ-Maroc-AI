import assert from 'node:assert/strict'

import { AZDefaultProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZDefaultProductionNodeActivator'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
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
  name: 'activation-rematch-test',
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

const instantiation: AZInstantiation = {
  id: 1,
  production,
  instantiatedConditions: [],
  matchGoal: goal,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

let matcherCalls = 0

const rematchMatcher: AZInstantiationRematchMatcher = {
  matches: (
    candidate,
    productionNode,
    token,
    workingMemoryElement,
  ) => {
    matcherCalls += 1

    assert.equal(candidate, instantiation)
    assert.equal(productionNode, node)
    assert.equal(token, parentToken)
    assert.equal(workingMemoryElement, wme)

    return true
  },
}

const matchGoalResolver: AZReteMatchGoalResolver = {
  resolve: () => {
    throw new Error(
      'Goal resolution must not run after successful rematch',
    )
  },
}

const assertionTypeResolver:
  AZProductionAssertionTypeResolver = {
    resolve: () => {
      throw new Error(
        'Assertion type resolution must not run after successful rematch',
      )
    },
  }

const matchSet = new AZMatchSet()

matchSet.addRetraction({
  instantiation,
  productionNode: node,
})

assert.equal(matchSet.hasPendingChanges(), true)

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

assert.equal(matcherCalls, 1)
assert.equal(matchSet.hasPendingChanges(), false)

assert.equal(
  instantiation.reteToken,
  parentToken,
)

assert.equal(
  instantiation.reteWme,
  wme,
)

assert.equal(token.node, node)
assert.equal(node.tokens[0], token)
assert.equal(parentToken.children[0], token)

console.log(
  'AZ core production node rematch activation: OK',
)
