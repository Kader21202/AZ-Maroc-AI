import assert from 'node:assert/strict'
import test from 'node:test'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZProductionNodeActivator'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

test('AZ RETE right-unlinks positive children when a memory loses its last token ', () => {
  const factory = new AZDefaultReteNodeFactory()
  const root = factory.createDummyTopNode()
  const memory = factory.createMemoryNode(
    root,
    false,
    { levelsUp: 0, fieldNumber: 0 },
  )

  const alphaMemory = new AZAlphaMemory(
    9001,
    null,
    null,
    null,
    false,
  )

  const positive = factory.createPositiveNode(
    memory,
    true,
    alphaMemory,
    [],
  )

  assert.equal(positive.rightUnlinked, false)
  assert.equal(alphaMemory.getBetaNodes().includes(positive), true)

  const token: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: memory,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  memory.tokens.push(token)

  if (memory.nodeId === null) {
    throw new Error('AZ memory node must have a nodeId')
  }

  const hashIndex = new AZDefaultReteHashIndex()
  hashIndex.insertLeft(token, memory.nodeId)

  const productionNodeActivator: AZProductionNodeActivator = {
    activate() {
      throw new Error(
        'Production activation is not expected in this regression',
      )
    },
  }

  const remover = new AZDefaultReteTokenRemovalManager(
    hashIndex,
    new AZDefaultReteTokenIdentityManager(),
    productionNodeActivator,
    new AZDefaultReteLinkManager(),
  )

  remover.removeTokenAndSubtree(
    token,
    new AZMatchSet(),
  )

  assert.equal(memory.tokens.length, 0)
  assert.equal(
    positive.rightUnlinked,
    true,
    'AZ right-unlinks positive children when parent memory becomes empty',
  )
  assert.equal(
    alphaMemory.getBetaNodes().includes(positive),
    false,
    'Right-unlinked positive child must leave alpha-memory beta-node list',
  )
})
