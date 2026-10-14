import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZJustificationMaterializer } from '../../src/engines/cognitive/az/core/production/AZJustificationMaterializer'
import { AZJustificationInstantiationCreator } from '../../src/engines/cognitive/az/core/production/AZJustificationInstantiationCreator'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const wm = new AZWorkingMemory()

const state = symbols.makeIdentifier('S')
const operatorId = symbols.makeIdentifier('O')

const operator = symbols.makeStringConstant('operator')
const name = symbols.makeStringConstant('name')
const selectedName = symbols.makeStringConstant('selected')
const phase = symbols.makeStringConstant('phase')
const oldPhase = symbols.makeStringConstant('old')
const newPhase = symbols.makeStringConstant('new')

const operatorWme =
  wm.createElement(
    state,
    operator,
    operatorId,
    false,
  )

const nameWme =
  wm.createElement(
    operatorId,
    name,
    selectedName,
    false,
  )

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

function result(
  type: AZPreference['type'],
  value: typeof oldPhase,
): AZPreference {
  return {
    type,
    identifier: state,
    attribute: phase,
    value,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: true,
    inTemporaryMemory: true,
    slot: null,
    instantiation: sourceInstantiation,
  }
}

const rejectOld =
  result('REJECT', oldPhase)

const acceptNew =
  result('ACCEPTABLE', newPhase)

const materializer =
  new AZJustificationMaterializer()

const production =
  materializer.materialize(
    'az-justify-1',
    [operatorWme, nameWme],
    [rejectOld, acceptNew],
  )

assert.equal(
  production.name,
  'az-justify-1',
)

assert.equal(
  production.declaredSupport,
  'O_SUPPORT',
)

assert.deepEqual(
  production.conditions,
  [
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: state,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: operator,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: operatorId,
      },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: operatorId,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: name,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: selectedName,
      },
      acceptable: false,
    },
  ],
)

assert.deepEqual(
  production.actions,
  [
    {
      type: 'MAKE',
      preferenceType: 'REJECT',
      identifier: {
        type: 'SYMBOL',
        symbol: state,
      },
      attribute: {
        type: 'SYMBOL',
        symbol: phase,
      },
      value: {
        type: 'SYMBOL',
        symbol: oldPhase,
      },
      support: 'O_SUPPORT',
    },
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol: state,
      },
      attribute: {
        type: 'SYMBOL',
        symbol: phase,
      },
      value: {
        type: 'SYMBOL',
        symbol: newPhase,
      },
      support: 'O_SUPPORT',
    },
  ],
)

assert.deepEqual(
  production.instantiations,
  [],
)

assert.equal(
  production.productionNode,
  null,
)

console.log('AZ justification materialization: OK')


const goalIdentities = new AZDefaultGoalIdentityRegistry()
goalIdentities.registerGoal(state, 1)

const instantiationCreator =
  new AZJustificationInstantiationCreator(
    goalIdentities,
  )

const justificationInstantiation =
  instantiationCreator.create(
    production,
    [operatorWme, nameWme],
    [rejectOld, acceptNew],
  )

assert.equal(justificationInstantiation.production, production)
assert.equal(justificationInstantiation.matchGoal, state)
assert.equal(justificationInstantiation.matchGoalLevel, 1)
assert.equal(justificationInstantiation.instantiatedConditions.length, 2)
assert.equal(justificationInstantiation.generatedPreferences.length, 2)
assert.equal(justificationInstantiation.generatedPreferences[0].instantiation, justificationInstantiation)
assert.equal(justificationInstantiation.generatedPreferences[1].instantiation, justificationInstantiation)

console.log('AZ justification instantiation: OK')
