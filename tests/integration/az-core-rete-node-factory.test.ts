import { strict as assert } from 'node:assert'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'

const factory = new AZDefaultReteNodeFactory()
const root = factory.createDummyTopNode()

const location = {
  levelsUp: 1,
  fieldNumber: 2 as const,
}

const alphaMemory = new AZAlphaMemory(
  1,
  null,
  null,
  null,
  false,
)

const memory = factory.createMemoryNode(
  root,
  true,
  location,
)

const preservedMemory = factory.createMemoryNode(
  root,
  true,
  location,
  84,
)

assert.equal(preservedMemory.nodeId, 84)
assert.notEqual(memory.nodeId, null)
assert.notEqual(memory.nodeId, 84)
const positive = factory.createPositiveNode(
  memory,
  true,
  alphaMemory,
  [],
)

const mp = factory.createMpNode(
  root,
  false,
  location,
  alphaMemory,
  [],
  42,
)

const negative = factory.createNegativeNode(
  root,
  false,
  location,
  alphaMemory,
  [],
)

assert.equal(root.type, 'DUMMY_TOP')
assert.equal(memory.type, 'MEMORY')
assert.equal(positive.type, 'POSITIVE')
assert.equal(mp.type, 'UNHASHED_MP')
assert.equal(mp.nodeId, 42)
assert.equal(negative.type, 'UNHASHED_NEGATIVE')

assert.equal(memory.parent, root)
assert.equal(positive.parent, memory)
assert.equal(root.children.includes(memory), true)
assert.equal(memory.children.includes(positive), true)

assert.equal(alphaMemory.getBetaNodes().includes(positive), true)
assert.equal(alphaMemory.getBetaNodes().includes(mp), true)
assert.equal(alphaMemory.getBetaNodes().includes(negative), true)

const cnBottom = factory.createMemoryNode(
  root,
  false,
  location,
)

const { node: cn, partner } =
  factory.createCnNodes(root, cnBottom)

assert.equal(cn.type, 'CN')
assert.equal(partner.type, 'CN_PARTNER')
assert.equal(cn.partner, partner)
assert.equal(partner.partner, cn)
assert.equal(cnBottom.children.includes(partner), true)

const production: AZProduction = {
  name: 'az-factory-test',
  declaredSupport: 'I_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
}

const productionNode =
  factory.createProductionNode(root, production)

assert.equal(productionNode.production, production)
assert.equal(production.productionNode, productionNode)
assert.equal(root.children.includes(productionNode), true)

console.log('AZ RETE node factory structural invariants: OK')
