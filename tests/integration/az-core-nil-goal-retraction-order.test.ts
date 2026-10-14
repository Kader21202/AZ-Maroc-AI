import assert from 'node:assert/strict'

import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const goal = symbol('S')
const oldNilGoal = symbol('N')

const production: AZProduction = {
  name: 'nil-goal-retraction-order-production',
  declaredSupport: 'I_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
}

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 903,
  parent: null,
  children: [],
  production,
  tokens: [],
}

const makeInstantiation = (
  id: number,
  matchGoal: AZSymbol,
): AZInstantiation => ({
  id,
  production,
  instantiatedConditions: [],
  matchGoal,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
})

const first = makeInstantiation(1, goal)
const second = makeInstantiation(2, goal)
const existingNil = makeInstantiation(3, oldNilGoal)

const matchSet = new AZMatchSet()

/*
 * Simulate an older NIL-goal retraction already waiting.
 */
matchSet.addNilGoalRetraction({
  instantiation: existingNil,
  productionNode,
})

/*
 * AZ inserts each new ordinary retraction at the head:
 * add R1, then R2 => goal list R2 -> R1.
 */
matchSet.addRetraction({
  instantiation: first,
  productionNode,
})

matchSet.addRetraction({
  instantiation: second,
  productionNode,
})

assert.equal(
  matchSet.transferRetractionsToNilGoal(goal),
  2,
)

/*
 * AZ moves the complete goal list to the front of the
 * existing NIL-goal list without reversing the moved block.
 *
 * Expected:
 *   R2 -> R1 -> existing NIL retraction
 */
assert.equal(
  matchSet.takeNextNilGoalRetraction(),
  second,
  'AZ invariant: newest transferred goal retraction must remain first on the NIL-goal list',
)

assert.equal(
  matchSet.takeNextNilGoalRetraction(),
  first,
  'AZ invariant: transferred goal retraction order must be preserved',
)

assert.equal(
  matchSet.takeNextNilGoalRetraction(),
  existingNil,
  'AZ invariant: transferred goal retractions must precede older NIL-goal retractions',
)

assert.equal(
  matchSet.hasPendingChanges(),
  false,
)

console.log(
  'AZ NIL-goal retraction transfer ordering: OK',
)
