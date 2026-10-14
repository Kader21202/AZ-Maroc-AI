import assert from 'node:assert/strict'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZNegativeNode } from '../../src/engines/cognitive/az/core/production/AZNegativeNode'
import type { AZProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZProductionNodeActivator'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const alphaMemory =
  new AZAlphaMemory(
    1,
    null,
    null,
    null,
    false,
  )

const negative: AZNegativeNode = {
  type: 'UNHASHED_NEGATIVE',
  nodeId: 2,
  parent: null,
  children: [],
  leftHashFieldNumber: null,
  leftHashLevelsUp: null,
  alphaMemory,
  tests: [],
  tokens: [],
  rightUnlinked: false,
}

alphaMemory.addBetaNode(negative)

const token: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: negative,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

negative.tokens.push(token)

const hashIndex =
  new AZDefaultReteHashIndex()

hashIndex.insertLeft(
  token,
  negative.nodeId!,
)

const productionNodeActivator:
  AZProductionNodeActivator = {
    activate() {
      throw new Error(
        'Production activation is not expected',
      )
    },
  }

const manager =
  new AZDefaultReteTokenRemovalManager(
    hashIndex,
    new AZDefaultReteTokenIdentityManager(),
    productionNodeActivator,
    new AZDefaultReteLinkManager(),
  )

assert.equal(
  negative.tokens.length,
  1,
)

assert.equal(
  negative.rightUnlinked,
  false,
)

assert.equal(
  alphaMemory
    .getBetaNodes()
    .includes(negative),
  true,
)

manager.removeTokenAndSubtree(
  token,
  new AZMatchSet(),
)

assert.equal(
  negative.tokens.length,
  0,
)

assert.equal(
  hashIndex
    .getLeftBucket(negative.nodeId!)
    .includes(token),
  false,
)

assert.equal(
  negative.rightUnlinked,
  true,
  'AZ invariant: removing the last NEGATIVE left token must right-unlink the node',
)

assert.equal(
  alphaMemory
    .getBetaNodes()
    .includes(negative),
  false,
  'AZ invariant: a right-unlinked NEGATIVE node must leave the alpha-memory beta-node list',
)

console.log(
  'AZ RETE NEGATIVE last-token right-unlink: OK',
)
