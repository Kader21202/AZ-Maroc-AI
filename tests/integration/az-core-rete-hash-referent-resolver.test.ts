import assert from 'node:assert/strict'

import { AZDefaultReteHashReferentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashReferentResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const makeWme = (
  timetag: number,
  identifier: AZSymbol,
  attribute: AZSymbol,
  value: AZSymbol,
): AZWorkingMemoryElement => ({
  timetag,
  identifier,
  attribute,
  value,
  acceptable: false,
})

const i1 = symbol('I')
const a1 = symbol('A')
const v1 = symbol('V')

const i2 = symbol('J')
const a2 = symbol('B')
const v2 = symbol('W')

const parentWme = makeWme(1, i1, a1, v1)
const currentWme = makeWme(2, i2, a2, v2)

const grandParentWme =
  makeWme(
    0,
    symbol('G'),
    symbol('C'),
    symbol('X'),
  )

const grandParentToken: AZToken = {
  parent: null,
  workingMemoryElement: grandParentWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const parentToken: AZToken = {
  parent: grandParentToken,
  workingMemoryElement: parentWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const resolver =
  new AZDefaultReteHashReferentResolver()

assert.equal(
  resolver.resolve(
    parentToken,
    currentWme,
    {
      levelsUp: 1,
      fieldNumber: 2,
    },
  ),
  v2,
)

assert.equal(
  resolver.resolve(
    parentToken,
    currentWme,
    {
      levelsUp: 2,
      fieldNumber: 1,
    },
  ),
  a1,
)



assert.throws(
  () =>
    resolver.resolve(
      parentToken,
      currentWme,
      {
        levelsUp: 0,
        fieldNumber: 0,
      },
    ),
  /levelsUp must be at least 1/,
)

assert.equal(resolver.resolve(parentToken, currentWme, { levelsUp: 3, fieldNumber: 2 }), grandParentWme.value)

assert.throws(
  () =>
    resolver.resolve(
      null,
      currentWme,
      {
        levelsUp: 2,
        fieldNumber: 0,
      },
    ),
  /exceeds token ancestry/,
)

console.log(
  'AZ core RETE hash referent resolver: OK',
)

