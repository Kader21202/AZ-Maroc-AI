import assert from 'node:assert/strict'

import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const manager = new AZDefaultVariableBindingManager()

const variable: AZSymbol = {
  id: 'x',
  hashId: 1233,
  type: 'VARIABLE',
  value: 'x',
}

const constant: AZSymbol = {
  id: 'constant',
  hashId: 1370,
  type: 'STRING_CONSTANT',
  value: 'constant',
}

const variableTest: AZProductionTest = {
  type: 'EQUALITY',
  referent: variable,
}

const constantTest: AZProductionTest = {
  type: 'EQUALITY',
  referent: constant,
}

const sparseFirst = manager.bindVariablesInTest(
  variableTest,
  2,
  0,
  false,
)

assert.equal(sparseFirst.length, 1)
assert.equal(sparseFirst[0], variable)
assert.equal(manager.isBound(variable), true)

assert.deepEqual(
  manager.findLocation(variable, 5),
  {
    levelsUp: 3,
    fieldNumber: 0,
  },
)

const sparseSecond = manager.bindVariablesInTest(
  variableTest,
  4,
  1,
  false,
)

assert.equal(sparseSecond.length, 0)

assert.deepEqual(
  manager.findLocation(variable, 5),
  {
    levelsUp: 3,
    fieldNumber: 0,
  },
)

const dense = manager.bindVariablesInTest(
  variableTest,
  4,
  2,
  true,
)

assert.equal(dense.length, 1)
assert.equal(dense[0], variable)

assert.deepEqual(
  manager.findLocation(variable, 5),
  {
    levelsUp: 1,
    fieldNumber: 2,
  },
)

manager.popBindings(dense)

assert.deepEqual(
  manager.findLocation(variable, 5),
  {
    levelsUp: 3,
    fieldNumber: 0,
  },
)

assert.equal(
  manager.bindVariablesInTest(
    constantTest,
    6,
    1,
    false,
  ).length,
  0,
)

assert.equal(manager.isBound(constant), false)

manager.popBindings(sparseFirst)

assert.equal(manager.isBound(variable), false)
assert.equal(manager.findLocation(variable, 5), null)

const conjunctiveVariable: AZSymbol = {
  id: 'conjunctive-variable',
  hashId: 1507,
  type: 'VARIABLE',
  value: 'conjunctive-variable',
}

const conjunctiveTest: AZProductionTest = {
  type: 'CONJUNCTIVE',
  conjuncts: [
    {
      type: 'GREATER',
      referent: constant,
    },
    {
      type: 'EQUALITY',
      referent: conjunctiveVariable,
    },
  ],
}

const conjunctiveBinding =
  manager.bindVariablesInTest(
    conjunctiveTest,
    7,
    2,
    false,
  )

assert.equal(conjunctiveBinding.length, 1)
assert.equal(
  conjunctiveBinding[0],
  conjunctiveVariable,
)

assert.deepEqual(
  manager.findLocation(
    conjunctiveVariable,
    9,
  ),
  {
    levelsUp: 2,
    fieldNumber: 2,
  },
)

manager.popBindings(conjunctiveBinding)

const conjunctiveWithoutEquality: AZProductionTest = {
  type: 'CONJUNCTIVE',
  conjuncts: [
    {
      type: 'GREATER',
      referent: variable,
    },
    {
      type: 'NOT_EQUAL',
      referent: variable,
    },
  ],
}

assert.equal(
  manager.bindVariablesInTest(
    conjunctiveWithoutEquality,
    7,
    1,
    false,
  ).length,
  0,
)

const relationalVariableTest: AZProductionTest = {
  type: 'LESS',
  referent: variable,
}

assert.equal(
  manager.bindVariablesInTest(
    relationalVariableTest,
    7,
    1,
    false,
  ).length,
  0,
)

assert.equal(manager.isBound(variable), false)

console.log(
  'AZ core variable binding manager: OK',
)
