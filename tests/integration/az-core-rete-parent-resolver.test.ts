import assert from 'node:assert/strict'

import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
import type { AZReteNodeBase } from '../../src/engines/cognitive/az/core/production/AZReteNodeBase'

const node = (
  type: AZReteNodeBase['type'],
  parent: AZReteNodeBase | null = null,
  nodeId = 1,
): AZReteNodeBase => ({
  type,
  nodeId,
  parent,
  children: [],
})

const resolver =
  new AZDefaultReteParentResolver()

const root =
  node('DUMMY_TOP', null, 1)

const memory =
  node('MEMORY', root, 2)

const positive =
  node('POSITIVE', memory, 3)

assert.equal(
  resolver.getRealParent(positive),
  root,
)

const unhashedMemory =
  node('UNHASHED_MEMORY', root, 4)

const unhashedPositive =
  node('UNHASHED_POSITIVE', unhashedMemory, 5)

assert.equal(
  resolver.getRealParent(unhashedPositive),
  root,
)

const negative =
  node('NEGATIVE', memory, 6)

assert.equal(
  resolver.getRealParent(negative),
  memory,
)

const mp =
  node('MP', memory, 7)

assert.equal(
  resolver.getRealParent(mp),
  memory,
)

assert.equal(
  resolver.getRealParent(root),
  null,
)

console.log(
  'AZ core RETE real parent resolution: OK',
)
