import assert from 'node:assert/strict'

import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import { AZDefaultReteTestBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestBuilder'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const bindings = new AZDefaultVariableBindingManager()
const builder = new AZDefaultReteTestBuilder(bindings)

const variable: AZSymbol = {
  id: 'x',
  hashId: 685,
  type: 'VARIABLE',
  value: 'x',
}

const constantA: AZSymbol = {
  id: 'a',
  hashId: 822,
  type: 'STRING_CONSTANT',
  value: 'a',
}

const constantB: AZSymbol = {
  id: 'b',
  hashId: 959,
  type: 'STRING_CONSTANT',
  value: 'b',
}

let result = builder.buildForTest(
  {
    type: 'EQUALITY',
    referent: constantA,
  },
  1,
  0,
  [],
  null,
)

assert.equal(result.alphaConstant, constantA)
assert.equal(result.tests.length, 0)

result = builder.buildForTest(
  {
    type: 'EQUALITY',
    referent: constantB,
  },
  1,
  0,
  result.tests,
  result.alphaConstant,
)

assert.equal(result.alphaConstant, constantA)
assert.equal(result.tests[0]?.type, 'CONSTANT_RELATIONAL')
assert.equal(result.tests[0]?.relationalType, 'EQUAL')

bindings.pushBinding(variable, 2, 1)

result = builder.buildForTest(
  {
    type: 'EQUALITY',
    referent: variable,
  },
  2,
  1,
  [],
  null,
)

assert.equal(result.tests.length, 0)

result = builder.buildForTest(
  {
    type: 'EQUALITY',
    referent: variable,
  },
  5,
  2,
  [],
  null,
)

assert.equal(result.tests[0]?.type, 'VARIABLE_RELATIONAL')
assert.equal(result.tests[0]?.relationalType, 'EQUAL')
assert.deepEqual(result.tests[0]?.data, {
  kind: 'VARIABLE',
  location: {
    levelsUp: 3,
    fieldNumber: 1,
  },
})

result = builder.buildForTest(
  {
    type: 'NOT_EQUAL',
    referent: constantA,
  },
  5,
  2,
  [],
  null,
)

assert.equal(result.tests[0]?.type, 'CONSTANT_RELATIONAL')
assert.equal(result.tests[0]?.relationalType, 'NOT_EQUAL')

result = builder.buildForTest(
  {
    type: 'DISJUNCTION',
    disjunction: [constantA, constantB],
  },
  5,
  2,
  [],
  null,
)

assert.equal(result.tests[0]?.type, 'DISJUNCTION')
assert.deepEqual(result.tests[0]?.data, {
  kind: 'DISJUNCTION',
  symbols: [constantA, constantB],
})

result = builder.buildForTest(
  { type: 'GOAL_ID' },
  5,
  2,
  [],
  null,
)

assert.equal(result.tests[0]?.type, 'ID_IS_GOAL')
assert.equal(result.tests[0]?.rightFieldNumber, 0)
result = builder.buildForTest(
  { type: 'IMPASSE_ID' },
  5,
  2,
  [],
  null,
)

assert.equal(result.tests[0]?.type, 'ID_IS_IMPASSE')
assert.equal(result.tests[0]?.rightFieldNumber, 0)

const conjunctive: AZProductionTest = {
  type: 'CONJUNCTIVE',
  conjuncts: [
    {
      type: 'NOT_EQUAL',
      referent: constantA,
    },
    {
      type: 'GREATER',
      referent: constantB,
    },
  ],
}

result = builder.buildForTest(
  conjunctive,
  5,
  2,
  [],
  null,
)

assert.equal(result.tests.length, 2)
assert.equal(result.tests[0]?.relationalType, 'GREATER')
assert.equal(result.tests[1]?.relationalType, 'NOT_EQUAL')
assert.equal(result.tests[0]?.next, result.tests[1])

const unboundVariable: AZSymbol = {
  id: 'unbound',
  hashId: 1096,
  type: 'VARIABLE',
  value: 'unbound',
}

assert.throws(
  () =>
    builder.buildForTest(
      {
        type: 'LESS',
        referent: unboundVariable,
      },
      5,
      0,
      [],
      null,
    ),
  /unbound variable/,
)

console.log('AZ core rete test builder: OK')
