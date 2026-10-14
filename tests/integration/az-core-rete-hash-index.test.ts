import assert from 'node:assert/strict'

import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import type { AZRightMemory } from '../../src/engines/cognitive/az/core/production/AZRightMemory'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: symbol('I'),
  attribute: symbol('A'),
  value: symbol('V'),
  acceptable: false,
}

const token: AZToken = {
  parent: null,
  workingMemoryElement: wme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const rightMemory: AZRightMemory = {
  workingMemoryElement: wme,
  alphaMemoryId: 1,
}

const index = new AZDefaultReteHashIndex()

assert.equal(index.tableSize, 1 << 14)
assert.equal(index.mask, index.tableSize - 1)

index.insertLeft(token, 12345)
index.insertLeft(token, 12345)

assert.deepEqual(
  index.getLeftBucket(12345),
  [token],
)

assert.equal(
  index.removeLeft(token, 12345),
  true,
)

assert.equal(
  index.removeLeft(token, 12345),
  false,
)

index.insertRight(rightMemory, 98765)
index.insertRight(rightMemory, 98765)

assert.deepEqual(
  index.getRightBucket(98765),
  [rightMemory],
)

assert.equal(
  index.removeRight(rightMemory, 98765),
  true,
)

assert.equal(
  index.removeRight(rightMemory, 98765),
  false,
)


const collisionToken: AZToken = { ...token, children: [] }
index.insertLeft(token, 1)
index.insertLeft(collisionToken, 16385)
assert.equal(index.getLeftBucket(1), index.getLeftBucket(16385))
assert.equal(index.getLeftBucket(1).includes(token), true)
assert.equal(index.getLeftBucket(1).includes(collisionToken), true)

const collisionRight: AZRightMemory = { workingMemoryElement: wme, alphaMemoryId: 2 }
index.insertRight(rightMemory, 2)
index.insertRight(collisionRight, 16386)
assert.equal(index.getRightBucket(2), index.getRightBucket(16386))
assert.equal(index.getRightBucket(2).includes(rightMemory), true)
assert.equal(index.getRightBucket(2).includes(collisionRight), true)

console.log(
  'AZ core RETE hash index: OK',
)

