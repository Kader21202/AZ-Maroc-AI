import assert from 'node:assert/strict'

import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
import { AZInstantiationCreator } from '../../src/engines/cognitive/az/core/production/AZInstantiationCreator'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const state = symbol('S')
const attribute = symbol('A')
const value = symbol('V')

const condition = {
  type: 'POSITIVE' as const,
  identifierTest: {
    type: 'EQUALITY' as const,
    referent: state,
  },
  attributeTest: {
    type: 'EQUALITY' as const,
    referent: attribute,
  },
  valueTest: {
    type: 'EQUALITY' as const,
    referent: value,
  },
  acceptable: false,
}

const production: AZProduction = {
  name: 'az-instantiation-creator',
  declaredSupport: 'I_SUPPORT',
  conditions: [condition],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: state,
  attribute,
  value,
  acceptable: false,
}

const factory =
  new AZDefaultReteNodeFactory()

const root =
  factory.createDummyTopNode()

const memory =
  factory.createMemoryNode(
    root,
    false,
    {
      levelsUp: 0,
      fieldNumber: 0,
    },
  )

const alphaMemory =
  new AZAlphaMemory(
    1,
    null,
    null,
    null,
    false,
  )

const positive =
  factory.createPositiveNode(
    memory,
    false,
    alphaMemory,
    [],
  )

const productionNode =
  factory.createProductionNode(
    positive,
    production,
  )

const token: AZToken = {
  parent: null,
  workingMemoryElement: wme,
  node: memory,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const creator =
  new AZInstantiationCreator(
    new AZDefaultReteParentResolver(),
  )

const first =
  creator.create(
    production,
    productionNode,
    token,
    wme,
    state,
    1,
  )

assert.equal(first.id, 1)
assert.equal(first.production, production)
assert.equal(first.matchGoal, state)
assert.equal(first.matchGoalLevel, 1)
assert.equal(first.inMatchSet, true)
assert.equal(first.reteToken, token)
assert.equal(first.reteWme, wme)
assert.deepEqual(first.generatedPreferences, [])

assert.equal(
  first.instantiatedConditions.length,
  1,
)

const instantiatedCondition =
  first.instantiatedConditions[0]

assert.notEqual(
  instantiatedCondition,
  undefined,
)

if (
  instantiatedCondition === undefined ||
  instantiatedCondition.type !== 'POSITIVE'
) {
  throw new Error(
    'Expected one POSITIVE instantiated condition',
  )
}

assert.equal(
  instantiatedCondition.sourceCondition,
  condition,
)

assert.equal(
  instantiatedCondition.workingMemoryElement,
  wme,
)

/*
 * Creation and registration are separate operations.
 * AZInstantiationCreator must not mutate
 * production.instantiations.
 */
assert.equal(
  production.instantiations.length,
  0,
)

const secondProduction: AZProduction = {
  name: 'az-instantiation-creator-second',
  declaredSupport: 'I_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const secondNode =
  factory.createProductionNode(
    root,
    secondProduction,
  )

const second =
  creator.create(
    secondProduction,
    secondNode,
    token,
    wme,
    state,
    1,
  )

assert.equal(second.id, 2)

assert.equal(
  secondProduction.instantiations.length,
  0,
)

console.log(
  'AZ instantiation creator contract: OK',
)
