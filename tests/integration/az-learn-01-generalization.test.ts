import assert from 'node:assert/strict'

import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZJustificationMaterializer } from '../../src/engines/cognitive/az/core/production/AZJustificationMaterializer'
import { AZCausalRuleGeneralizer } from '../../src/engines/cognitive/az/core/learning/AZCausalRuleGeneralizer'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'

const symbols = new AZSymbolManager()
const memory = new AZWorkingMemory()

const state = symbols.makeIdentifier('S')
const operatorId = symbols.makeIdentifier('O')

const operator = symbols.makeStringConstant('operator')
const name = symbols.makeStringConstant('name')
const selected = symbols.makeStringConstant('selected')
const phase = symbols.makeStringConstant('phase')
const ready = symbols.makeStringConstant('ready')

const grounds = [
  memory.createElement(state, operator, operatorId, false),
  memory.createElement(operatorId, name, selected, false),
]

const sourceInstantiation: AZInstantiation = {
  id: 1,
  production: null,
  instantiatedConditions: [],
  matchGoal: state,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const result: AZPreference = {
  type: 'ACCEPTABLE',
  identifier: state,
  attribute: phase,
  value: ready,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: true,
  inTemporaryMemory: true,
  slot: null,
  instantiation: sourceInstantiation,
}

const justification =
  new AZJustificationMaterializer().materialize(
    'az-learn-01-source',
    grounds,
    [result],
  )

const generalizer = new AZCausalRuleGeneralizer(symbols)

const learned = generalizer.generalize(
  'az-learn-01-candidate',
  justification,
)

assert.equal(learned.conditions.length, 2)
assert.equal(learned.actions.length, 1)

const first = learned.conditions[0]
const second = learned.conditions[1]
const action = learned.actions[0]

assert.equal(first.type, 'POSITIVE')
assert.equal(second.type, 'POSITIVE')
assert.equal(action.type, 'MAKE')

if (
  first.type !== 'POSITIVE' ||
  second.type !== 'POSITIVE' ||
  action.type !== 'MAKE'
) {
  throw new Error('Unexpected production structure')
}

const stateVariable = first.identifierTest.referent
const operatorVariable = first.valueTest.referent

assert.equal(stateVariable?.type, 'VARIABLE')
assert.equal(operatorVariable?.type, 'VARIABLE')

assert.equal(
  second.identifierTest.referent,
  operatorVariable,
  'Operator identity must be preserved across conditions',
)

assert.equal(
  first.attributeTest.referent,
  operator,
  'Operator attribute must remain constant',
)

assert.equal(
  second.valueTest.referent,
  selected,
  'Selected constant must not be generalized',
)

assert.deepEqual(action.identifier, {
  type: 'SYMBOL',
  symbol: stateVariable,
})

assert.deepEqual(action.attribute, {
  type: 'SYMBOL',
  symbol: phase,
})

assert.deepEqual(action.value, {
  type: 'SYMBOL',
  symbol: ready,
})

assert.equal(
  justification.conditions[0],
  grounds[0] ? justification.conditions[0] : null,
)

assert.equal(
  justification.conditions[0].type === 'POSITIVE'
    ? justification.conditions[0].identifierTest.referent
    : null,
  state,
  'Original justification must remain unchanged',
)

console.log('AZ LEARN 01 structural generalization: OK')
