import assert from 'node:assert/strict'

import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZDefaultReteLocationResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLocationResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: 1,
  type: 'IDENTIFIER',
  value: id,
})

const makeWme = (
  timetag: number,
): AZWorkingMemoryElement => ({
  timetag,
  identifier: symbol(`I${timetag}`),
  attribute: symbol(`A${timetag}`),
  value: symbol(`V${timetag}`),
  acceptable: false,
})

const makeToken = (
  workingMemoryElement: AZWorkingMemoryElement | null,
  parent: AZToken | null,
): AZToken => ({
  parent,
  workingMemoryElement,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
})

const resolver =
  new AZDefaultReteLocationResolver()

const currentWme = makeWme(1)
const parentWme = makeWme(2)
const grandParentWme = makeWme(3)

const grandParentToken =
  makeToken(grandParentWme, null)

const parentToken =
  makeToken(parentWme, grandParentToken)

const token =
  makeToken(null, parentToken)

assert.equal(
  resolver.resolve(
    token,
    currentWme,
    0,
    0,
  ),
  currentWme.identifier,
)

assert.equal(
  resolver.resolve(
    token,
    currentWme,
    0,
    1,
  ),
  currentWme.attribute,
)

assert.equal(
  resolver.resolve(
    token,
    currentWme,
    0,
    2,
  ),
  currentWme.value,
)

assert.equal(
  resolver.resolve(
    parentToken,
    currentWme,
    1,
    2,
  ),
  parentWme.value,
)

assert.equal(
  resolver.resolve(
    parentToken,
    currentWme,
    2,
    1,
  ),
  grandParentWme.attribute,
)

assert.throws(
  () =>
    resolver.resolve(
      token,
      currentWme,
      -1,
      0,
    ),
  /Rete location levelsUp cannot be negative/,
)

assert.throws(
  () =>
    resolver.resolve(
      token,
      null,
      0,
      0,
    ),
  /Rete location at current level requires working-memory element/,
)

assert.throws(
  () =>
    resolver.resolve(
      grandParentToken,
      currentWme,
      2,
      0,
    ),
  /Rete location exceeds token ancestry/,
)

const emptyToken =
  makeToken(null, null)

assert.throws(
  () =>
    resolver.resolve(
      emptyToken,
      currentWme,
      1,
      0,
    ),
  /Rete location token has no working-memory element/,
)

console.log(
  'AZ core RETE location resolution: OK',
)
