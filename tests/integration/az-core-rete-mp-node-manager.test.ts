import { strict as assert } from 'node:assert'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteMpNodeManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteMpNodeManager'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import type { AZDummyMatchesNode } from '../../src/engines/cognitive/az/core/production/AZDummyMatchesNode'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const factory = new AZDefaultReteNodeFactory()
const manager = new AZDefaultReteMpNodeManager(factory)

const root = factory.createDummyTopNode()

const alphaMemory = new AZAlphaMemory(
  1,
  null,
  null,
  null,
  false,
)

const location = {
  levelsUp: 1,
  fieldNumber: 2 as const,
}

const mp = factory.createMpNode(
  root,
  true,
  location,
  alphaMemory,
  [],
  42,
)

const child: AZDummyMatchesNode = {
  type: 'DUMMY_MATCHES',
  nodeId: null,
  parent: mp,
  children: [],
}

mp.children.push(child)

const token: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: mp,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

mp.tokens.push(token)

mp.leftUnlinked = true

const memory = manager.splitMpNode(mp)

assert.equal(memory.nodeId, 42)
assert.equal(memory.tokens.length, 1)
assert.equal(memory.tokens[0], token)
assert.equal(token.node, memory)

assert.equal(memory.children.length, 1)

const positive = memory.children[0]

assert.equal(positive.type, 'POSITIVE')

const positiveNode =
  positive as AZPositiveNode
assert.equal(positive.children.length, 1)
assert.equal(positive.children[0], child)
assert.equal(child.parent, positive)

assert.equal(
  positiveNode.leftUnlinked,
  true,
  'Splitting a left-unlinked MP must preserve left-unlinking on the resulting positive node',
)

assert.equal(
  alphaMemory.getBetaNodes().includes(
    positive as never,
  ),
  true,
)

assert.equal(
  alphaMemory.getBetaNodes().includes(mp),
  false,
)

positiveNode.leftUnlinked = true

const merged =
  manager.mergeIntoMpNode(memory)

assert.equal(merged.type, 'MP')
assert.equal(merged.nodeId, 42)

assert.equal(
  merged.leftUnlinked,
  true,
  'Merging a left-unlinked positive node must preserve left-unlinking on the resulting MP node',
)

assert.equal(merged.tokens.length, 1)
assert.equal(merged.tokens[0], token)
assert.equal(token.node, merged)

assert.equal(merged.children.length, 1)
assert.equal(merged.children[0], child)
assert.equal(child.parent, merged)

assert.equal(
  alphaMemory.getBetaNodes().includes(merged),
  true,
)

assert.equal(
  alphaMemory.getBetaNodes().includes(
    positive as never,
  ),
  false,
)

assert.equal(
  root.children.includes(merged),
  true,
)

assert.equal(
  root.children.includes(memory),
  false,
)

console.log(
  'AZ RETE MP split/merge invariants: OK',
)
