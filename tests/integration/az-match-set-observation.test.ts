import assert from 'node:assert/strict'

import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const goal = symbol('S')

const production: AZProduction = {
  name: 'match-set-observation-production',
  declaredSupport: 'I_SUPPORT',
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

const makeInstantiation = (
  id: number,
): AZInstantiation => ({
  id,
  production,
  instantiatedConditions: [],
  matchGoal: goal,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
})

const first = makeInstantiation(1)
const second = makeInstantiation(2)

const matchSet = new AZMatchSet()

matchSet.addAssertion({
  type: 'I_ASSERTION',
  production,
  token,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 1,
})

matchSet.addAssertion({
  type: 'O_ASSERTION',
  production,
  token,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 1,
})

matchSet.addRetraction({
  instantiation: first,
  productionNode,
})

matchSet.addRetraction({
  instantiation: second,
  productionNode,
})

matchSet.addNilGoalRetraction({
  instantiation: first,
  productionNode,
})

matchSet.addNilGoalRetraction({
  instantiation: second,
  productionNode,
})

const assertions = matchSet.getAssertions()
const retractions = matchSet.getRetractions()
const nilGoalRetractions =
  matchSet.getNilGoalRetractions()

assert.deepEqual(
  assertions.map(assertion => assertion.type),
  ['O_ASSERTION', 'I_ASSERTION'],
)

assert.deepEqual(
  retractions.map(
    retraction => retraction.instantiation.id,
  ),
  [2, 1],
)

assert.deepEqual(
  nilGoalRetractions.map(
    retraction => retraction.instantiation.id,
  ),
  [2, 1],
)

/*
 * Calling the observers again must neither consume
 * nor reorder the MatchSet collections.
 */
assert.deepEqual(
  matchSet.getAssertions(),
  assertions,
)

assert.deepEqual(
  matchSet.getRetractions(),
  retractions,
)

assert.deepEqual(
  matchSet.getNilGoalRetractions(),
  nilGoalRetractions,
)

/*
 * The returned arrays must be independent copies.
 */
const assertionCopy = [...assertions]
const retractionCopy = [...retractions]
const nilGoalCopy = [...nilGoalRetractions]

assertionCopy.pop()
retractionCopy.pop()
nilGoalCopy.pop()

assert.equal(
  matchSet.getAssertions().length,
  2,
)

assert.equal(
  matchSet.getRetractions().length,
  2,
)

assert.equal(
  matchSet.getNilGoalRetractions().length,
  2,
)

console.log(
  'AZ MatchSet observation: OK',
)
