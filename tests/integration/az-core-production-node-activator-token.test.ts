import assert from 'node:assert/strict'

import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZDefaultProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZDefaultProductionNodeActivator'
import type { AZInstantiationRematchMatcher } from '../../src/engines/cognitive/az/core/production/AZInstantiationRematchMatcher'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionAssertionTypeResolver } from '../../src/engines/cognitive/az/core/production/AZProductionAssertionTypeResolver'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZReteMatchGoalResolver } from '../../src/engines/cognitive/az/core/production/AZReteMatchGoalResolver'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const goal = symbol('S')
const value = symbol('V')

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: goal,
  attribute: symbol('A'),
  value,
  acceptable: false,
}

const production: AZProduction = {
  name: 'activation-token-test',
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

const matchGoalResolver: AZReteMatchGoalResolver = {
  resolve: () => ({
    goal,
    level: 1,
  }),
}

const assertionTypeResolver:
  AZProductionAssertionTypeResolver = {
    resolve: () => 'O_ASSERTION',
  }

const activator =
  new AZDefaultProductionNodeActivator(
    rematchMatcher,
    matchGoalResolver,
    assertionTypeResolver,
  )

const matchSet = new AZMatchSet()

const token = activator.activate(
  node,
  parentToken,
  wme,
  matchSet,
)

assert.equal(token.parent, parentToken)
assert.equal(token.workingMemoryElement, wme)
assert.equal(token.node, node)
assert.equal(token.hashReferent, null)
assert.deepEqual(token.negativeMatches, [])
assert.deepEqual(token.children, [])

assert.equal(node.tokens.length, 1)
assert.equal(node.tokens[0], token)

assert.equal(parentToken.children.length, 1)
assert.equal(parentToken.children[0], token)

console.log(
  'AZ core production node token activation: OK',
)
