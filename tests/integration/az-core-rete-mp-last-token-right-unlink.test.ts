import assert from 'node:assert/strict'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZMpNode } from '../../src/engines/cognitive/az/core/production/AZMpNode'
import type { AZProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZProductionNodeActivator'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

function runLastTokenRemoval(
  leftUnlinked: boolean,
): {
  mp: AZMpNode
  token: AZToken
  alphaMemory: AZAlphaMemory
  hashIndex: AZDefaultReteHashIndex
} {
  const alphaMemory =
    new AZAlphaMemory(
      1,
      null,
      null,
      null,
      false,
    )

  const mp: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 2,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked,
    rightUnlinked: false,
  }

  alphaMemory.addBetaNode(mp)

  const token: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: mp,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  mp.tokens.push(token)

  const hashIndex =
    new AZDefaultReteHashIndex()

  hashIndex.insertLeft(
    token,
    mp.nodeId!,
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

  manager.removeTokenAndSubtree(
    token,
    new AZMatchSet(),
  )

  return {
    mp,
    token,
    alphaMemory,
    hashIndex,
  }
}

{
  const {
    mp,
    token,
    alphaMemory,
    hashIndex,
  } = runLastTokenRemoval(false)

  assert.equal(
    mp.tokens.length,
    0,
  )

  assert.equal(
    hashIndex
      .getLeftBucket(mp.nodeId!)
      .includes(token),
    false,
  )

  assert.equal(
    mp.rightUnlinked,
    true,
    'AZ invariant: removing the last token from a left-linked MP must right-unlink the node',
  )

  assert.equal(
    alphaMemory
      .getBetaNodes()
      .includes(mp),
    false,
    'AZ invariant: a right-unlinked MP must leave the alpha-memory beta-node list',
  )
}

{
  const {
    mp,
    alphaMemory,
  } = runLastTokenRemoval(true)

  assert.equal(
    mp.tokens.length,
    0,
  )

  assert.equal(
    mp.rightUnlinked,
    false,
    'AZ invariant: removing the last token from an already left-unlinked MP must not force right-unlinking',
  )

  assert.equal(
    alphaMemory
      .getBetaNodes()
      .includes(mp),
    true,
    'A left-unlinked MP that AZ does not right-unlink must remain in the alpha-memory beta-node list',
  )
}

console.log(
  'AZ RETE MP last-token unlink semantics: OK',
)
