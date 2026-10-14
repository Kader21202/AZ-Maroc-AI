import assert from 'node:assert/strict'

import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const identifier: AZSymbol = {
  id: 'S1',
  hashId: 137,
  type: 'IDENTIFIER',
  value: 'S1',
}

const attribute: AZSymbol = {
  id: 'name',
  hashId: 274,
  type: 'STRING_CONSTANT',
  value: 'name',
}

const value: AZSymbol = {
  id: 'az',
  hashId: 411,
  type: 'STRING_CONSTANT',
  value: 'az',
}

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier,
  attribute,
  value,
  acceptable: false,
}

assert.equal(wme.identifier, identifier)
assert.equal(wme.attribute, attribute)
assert.equal(wme.value, value)
assert.equal(wme.timetag, 1)
assert.equal(wme.acceptable, false)

console.log('AZ core working memory element contract: OK')
