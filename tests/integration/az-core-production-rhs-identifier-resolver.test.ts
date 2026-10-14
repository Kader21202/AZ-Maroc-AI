import assert from 'node:assert/strict'

import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZDefaultProductionRhsIdentifierResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultProductionRhsIdentifierResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: 1,
  type: 'IDENTIFIER',
  value: id,
})

const currentWme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: symbol('I1'),
  attribute: symbol('A1'),
  value: symbol('V1'),
  acceptable: false,
}

const parentWme: AZWorkingMemoryElement = {
  timetag: 2,
  identifier: symbol('I2'),
  attribute: symbol('A2'),
  value: symbol('V2'),
  acceptable: false,
}

const parentToken: AZToken = {
  parent: null,
  workingMemoryElement: parentWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const resolver =
  new AZDefaultProductionRhsIdentifierResolver()

const direct = symbol('DIRECT')

assert.equal(
  resolver.resolve(
    {
      type: 'SYMBOL',
      symbol: direct,
    },
    parentToken,
    currentWme,
  ),
  direct,
)

assert.equal(
  resolver.resolve(
    {
      type: 'UNBOUND_VARIABLE',
      index: 0,
    },
    parentToken,
    currentWme,
  ),
  null,
)

assert.equal(
  resolver.resolve(
    {
      type: 'FUNCALL',
      functionName: symbol('function'),
      arguments: [],
    },
    parentToken,
    currentWme,
  ),
  null,
)

assert.equal(
  resolver.resolve(
    {
      type: 'RETE_LOCATION',
      levelsUp: 0,
      fieldNumber: 2,
    },
    parentToken,
    currentWme,
  ),
  currentWme.value,
)

assert.equal(
  resolver.resolve(
    {
      type: 'RETE_LOCATION',
      levelsUp: 1,
      fieldNumber: 0,
    },
    parentToken,
    currentWme,
  ),
  parentWme.identifier,
)

assert.throws(
  () =>
    resolver.resolve(
      {
        type: 'RETE_LOCATION',
        levelsUp: 0,
        fieldNumber: 3,
      },
      parentToken,
      currentWme,
    ),
  /Invalid RETE field number: 3/,
)

console.log(
  'AZ core production RHS identifier resolution: OK',
)
