import assert from 'node:assert/strict'
import type { AZInstantiation } from '../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZCompletedInstantiationHandler } from '../src/engines/cognitive/az/core/production/AZInstantiationFiringEngine'

const source = {
  id: 1,
  production: null,
  instantiatedConditions: [],
  matchGoal: null,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
} satisfies AZInstantiation

const learned = {
  id: 2,
  production: null,
  instantiatedConditions: [],
  matchGoal: null,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
} satisfies AZInstantiation

const handler: AZCompletedInstantiationHandler = {
  handle(instantiation) {
    assert.equal(instantiation, source)
    return [learned]
  },
}

const created = handler.handle(source)

assert.deepEqual(
  created,
  [learned],
  'completed-instantiation handler must return newly created justification instantiations',
)

console.log('AZ completed-instantiation expansion contract: OK')
