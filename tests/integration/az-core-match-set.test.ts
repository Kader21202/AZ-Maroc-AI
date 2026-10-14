import assert from 'node:assert/strict'

import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const goal: AZSymbol = {
  id: 'S1',
  hashId: 1,
  type: 'IDENTIFIER',
  value: 'S1',
}

const production: AZProduction = {
  name: 'az-match-set-test',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [],
  instantiations: [],
}

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 1,
  parent: null,
  children: [],
  production,
  tokens: [],
}

const token: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: productionNode,
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
  reteToken: token,
  reteWme: null,
}

const matchSet = new AZMatchSet()

assert.equal(matchSet.hasPendingChanges(), false)

matchSet.addAssertion({
  type: 'I_ASSERTION',
  production,
  token,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 1,
})

assert.equal(matchSet.hasPendingChanges(), true)
assert.equal(matchSet.hasAssertion('I_ASSERTION', goal), true)

const postponed =
  matchSet.postponeNextAssertion('I_ASSERTION', goal)

assert.notEqual(postponed, null)
assert.equal(matchSet.hasAssertion('I_ASSERTION', goal), false)

matchSet.restorePostponedAssertions()
assert.equal(matchSet.hasAssertion('I_ASSERTION', goal), true)

const postponedAgain =
  matchSet.postponeNextAssertion('I_ASSERTION', goal)

assert.notEqual(postponedAgain, null)
assert.equal(
  matchSet.consumeLastPostponedAssertion(),
  postponedAgain,
)

assert.equal(matchSet.hasPendingChanges(), false)

matchSet.addRetraction({
  instantiation,
  productionNode,
})

assert.equal(matchSet.hasRetraction(goal), true)
assert.equal(
  matchSet.cancelRetraction(
    productionNode,
    candidate => candidate === instantiation,
  ),
  instantiation,
)

assert.equal(matchSet.hasPendingChanges(), false)

matchSet.addRetraction({
  instantiation,
  productionNode,
})

assert.equal(
  matchSet.transferRetractionsToNilGoal(goal),
  1,
)

assert.equal(matchSet.hasRetraction(goal), false)
assert.equal(
  matchSet.takeNextNilGoalRetraction(),
  instantiation,
)

assert.equal(matchSet.hasPendingChanges(), false)

matchSet.addRetraction({
  instantiation,
  productionNode,
})

assert.equal(
  matchSet.takeNextRetraction(goal),
  instantiation,
)

assert.equal(matchSet.hasPendingChanges(), false)

console.log('AZ core match set behavior: OK')
