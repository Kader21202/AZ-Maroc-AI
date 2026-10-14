import assert from 'node:assert/strict'

import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const makeToken = (): AZToken => ({
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
})

const manager =
  new AZDefaultReteTokenIdentityManager()

const first = makeToken()
const second = makeToken()

const firstIdentity =
  manager.getIdentity(first)

assert.ok(firstIdentity > 0)

assert.equal(
  manager.getIdentity(first),
  firstIdentity,
)

const secondIdentity =
  manager.getIdentity(second)

assert.notEqual(
  firstIdentity,
  secondIdentity,
)

assert.equal(
  secondIdentity,
  firstIdentity + 1,
)

console.log(
  'AZ core RETE token identity manager: OK',
)
