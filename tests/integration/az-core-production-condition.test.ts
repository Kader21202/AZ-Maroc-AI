import assert from 'node:assert/strict'

import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const identifier: AZSymbol = {
  id: 's1',
  hashId: 137,
  type: 'VARIABLE',
  value: 's1',
}

const identifierTest: AZProductionTest = {
  type: 'EQUALITY',
  referent: identifier,
}

const positive: AZProductionCondition = {
  type: 'POSITIVE',
  identifierTest,
  attributeTest: identifierTest,
  valueTest: identifierTest,
  acceptable: false,
}

const negative: AZProductionCondition = {
  type: 'NEGATIVE',
  identifierTest,
  attributeTest: identifierTest,
  valueTest: identifierTest,
  acceptable: true,
}

const conjunctiveNegation: AZProductionCondition = {
  type: 'CONJUNCTIVE_NEGATION',
  conditions: [
    positive,
    negative,
  ],
}

assert.equal(positive.type, 'POSITIVE')
assert.equal(negative.type, 'NEGATIVE')
assert.equal(
  conjunctiveNegation.conditions.length,
  2,
)

console.log(
  'AZ core production condition contract: OK',
)
