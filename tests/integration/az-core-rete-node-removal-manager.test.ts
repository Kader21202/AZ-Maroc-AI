import { strict as assert } from 'node:assert'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import type { AZProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZProductionNodeActivator'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteMpNodeManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteMpNodeManager'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import { AZDefaultReteNodeRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeRemovalManager'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const factory = new AZDefaultReteNodeFactory()
const matchSet = new AZMatchSet()

const hashIndex = new AZDefaultReteHashIndex()
const tokenIdentityManager =
  new AZDefaultReteTokenIdentityManager()

const linkManager = new AZDefaultReteLinkManager()

const productionNodeActivator: AZProductionNodeActivator = {
  activate: () => {
    throw new Error('Production activation is outside this node-removal test')
  },
}

const manager =
  new AZDefaultReteNodeRemovalManager(
    linkManager,
    new AZDefaultReteMpNodeManager(factory),
    new AZDefaultReteTokenRemovalManager(
      hashIndex,
      tokenIdentityManager,
      productionNodeActivator,
      linkManager,
    ),
  )

const root = factory.createDummyTopNode()

const location = {
  levelsUp: 0,
  fieldNumber: 0 as const,
}

/*
 * Simple removal
 */
const memory =
  factory.createMemoryNode(
    root,
    false,
    location,
  )

manager.removeNode(memory, matchSet)

assert.equal(
  root.children.includes(memory),
  false,
)

assert.equal(memory.parent, null)

assert.throws(
  () => manager.removeNode(root, matchSet),
  /DUMMY_TOP/,
)

/*
 * Alpha-memory unlink
 */
const alphaMemory =
  new AZAlphaMemory(
    1,
    null,
    null,
    null,
    false,
  )

const memoryForPositive =
  factory.createMemoryNode(
    root,
    false,
    location,
  )

const positive =
  factory.createPositiveNode(
    memoryForPositive,
    false,
    alphaMemory,
    [],
  )

manager.removeNode(positive, matchSet)

assert.equal(
  alphaMemory
    .getBetaNodes()
    .includes(positive),
  false,
)

/*
 * NEGATIVE and MP alpha-memory unlink
 */
const negativeAlphaMemory = new AZAlphaMemory(10, null, null, null, false)
const negativeParent = factory.createMemoryNode(root, false, location)
const negative = factory.createNegativeNode(negativeParent, false, location, negativeAlphaMemory, [])
assert.equal(negativeAlphaMemory.getBetaNodes().includes(negative), true)
manager.removeNode(negative, matchSet)
assert.equal(negativeAlphaMemory.getBetaNodes().includes(negative), false)

const mpAlphaMemory = new AZAlphaMemory(11, null, null, null, false)
const mpParent = factory.createMemoryNode(root, false, location)
const mp = factory.createMpNode(mpParent, false, location, mpAlphaMemory, [])
assert.equal(mpAlphaMemory.getBetaNodes().includes(mp), true)
manager.removeNode(mp, matchSet)
assert.equal(mpAlphaMemory.getBetaNodes().includes(mp), false)
/*
 * Recursive removal
 */
const recursiveMemory =
  factory.createMemoryNode(
    root,
    false,
    location,
  )

const recursiveChild =
  factory.createMemoryNode(
    recursiveMemory,
    false,
    location,
  )

manager.removeNode(
  recursiveChild,
  matchSet,
)

assert.equal(
  root.children.includes(
    recursiveMemory,
  ),
  false,
)

/*
 * MEMORY + POSITIVE -> MP after sibling removal
 */
const mergeMemory =
  factory.createMemoryNode(
    root,
    false,
    location,
  )

const removedAlpha =
  new AZAlphaMemory(
    2,
    null,
    null,
    null,
    false,
  )

const remainingAlpha =
  new AZAlphaMemory(
    3,
    null,
    null,
    null,
    false,
  )

const removedPositive =
  factory.createPositiveNode(
    mergeMemory,
    false,
    removedAlpha,
    [],
  )

factory.createPositiveNode(
  mergeMemory,
  false,
  remainingAlpha,
  [],
)

manager.removeNode(
  removedPositive,
  matchSet,
)

const mergedNode =
  root.children.find(
    (child) =>
      child.type === 'UNHASHED_MP' &&
      'alphaMemory' in child &&
      child.alphaMemory ===
        remainingAlpha,
  )

assert.notEqual(
  mergedNode,
  undefined,
)

/*
 * CN / CN_PARTNER
 */
const cnSubcondition =
  factory.createMemoryNode(
    root,
    false,
    location,
  )

const {
  node: cn,
  partner,
} =
  factory.createCnNodes(
    root,
    cnSubcondition,
  )

manager.removeNode(cn, matchSet)

assert.equal(cn.parent, null)
assert.equal(partner.parent, null)
assert.equal(cn.partner, null)
assert.equal(partner.partner, null)

/*
 * Token removal before structural removal
 */
const tokenMemory =
  factory.createMemoryNode(
    root,
    false,
    location,
  )

const token: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: tokenMemory,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

tokenMemory.tokens.push(token)

manager.removeNode(
  tokenMemory,
  new AZMatchSet(),
)

assert.equal(
  tokenMemory.tokens.length,
  0,
)

assert.equal(token.node, null)

/*
 * Production protection
 */
const production: AZProduction = {
  name: 'protected-p-node',
  declaredSupport: 'I_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
}

const productionNode =
  factory.createProductionNode(
    root,
    production,
  )

assert.throws(
  () =>
    manager.removeNode(
      productionNode,
      matchSet,
    ),
  /PRODUCTION/,
)

console.log(
  'AZ RETE node removal invariants: OK',
)
