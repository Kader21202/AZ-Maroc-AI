import assert from 'node:assert/strict'

import type { AZReteTest } from '../../src/engines/cognitive/az/core/production/AZReteTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const constant: AZSymbol = {
  id: 'c1',
  hashId: 137,
  type: 'STRING_CONSTANT',
  value: 'name',
}

const test: AZReteTest = {
  rightFieldNumber: 1,
  type: 'CONSTANT_RELATIONAL',
  relationalType: 'EQUAL',
  data: {
    kind: 'CONSTANT',
    symbol: constant,
  },
  next: null,
}

assert.equal(test.type, 'CONSTANT_RELATIONAL')
assert.equal(test.relationalType, 'EQUAL')
assert.equal(test.data.kind, 'CONSTANT')
assert.equal(test.next, null)

console.log('AZ core rete test contract: OK')
