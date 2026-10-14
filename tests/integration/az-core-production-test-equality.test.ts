import assert from 'node:assert/strict'

import { findAZEqualityTest } from '../../src/engines/cognitive/az/core/production/AZProductionTestEquality'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const variable: AZSymbol = {
  id: 'x',
  hashId: 137,
  type: 'VARIABLE',
  value: 'x',
}

const equality: AZProductionTest = {
  type: 'EQUALITY',
  referent: variable,
}

assert.equal(
  findAZEqualityTest(equality),
  equality,
)

const relational: AZProductionTest = {
  type: 'GREATER',
  referent: variable,
}

assert.equal(
  findAZEqualityTest(relational),
  null,
)

const conjunctive: AZProductionTest = {
  type: 'CONJUNCTIVE',
  conjuncts: [
    relational,
    equality,
  ],
}

assert.equal(
  findAZEqualityTest(conjunctive),
  equality,
)

const conjunctiveWithoutEquality: AZProductionTest = {
  type: 'CONJUNCTIVE',
  conjuncts: [
    relational,
    {
      type: 'NOT_EQUAL',
      referent: variable,
    },
  ],
}

assert.equal(
  findAZEqualityTest(conjunctiveWithoutEquality),
  null,
)

console.log(
  'AZ core production test equality: OK',
)
