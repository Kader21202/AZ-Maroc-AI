import assert from 'node:assert/strict'

import { getAZReteWmeField } from '../../src/engines/cognitive/az/core/production/AZReteWmeField'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const identifier: AZSymbol = {
  id: 'S1',
  hashId: 137,
  type: 'IDENTIFIER',
  value: 'S1',
}

const attribute: AZSymbol = {
  id: 'attr',
  hashId: 274,
  type: 'STRING_CONSTANT',
  value: 'attr',
}

const value: AZSymbol = {
  id: 'value',
  hashId: 411,
  type: 'STRING_CONSTANT',
  value: 'value',
}

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier,
  attribute,
  value,
  acceptable: false,
}

assert.equal(getAZReteWmeField(wme, 0), identifier)
assert.equal(getAZReteWmeField(wme, 1), attribute)
assert.equal(getAZReteWmeField(wme, 2), value)

console.log('AZ core rete WME field: OK')
