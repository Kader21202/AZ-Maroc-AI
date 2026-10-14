import assert from 'node:assert/strict'
import test from 'node:test'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteActivationEngine } from '../../src/engines/cognitive/az/core/production/AZDefaultReteActivationEngine'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteHashReferentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashReferentResolver'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZMemoryNode } from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

test('AZ RETE right addition relinks a left-unlinked positive node ', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const linkManager = new AZDefaultReteLinkManager()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    linkManager,
  )

  const alphaMemory = new AZAlphaMemory(
    9100,
    null,
    null,
    null,
    false,
  )

  const parentMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 9101,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 9102,
    parent: parentMemory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: true,
    rightUnlinked: false,
  }

  parentMemory.children.push(positive)
  alphaMemory.addBetaNode(positive)

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: parentMemory,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  parentMemory.tokens.push(parentToken)
  hashIndex.insertLeft(
    parentToken,
    parentMemory.nodeId!,
  )

  const identifier = {
    id: 'RELINK-P-I',
    hashId: 9110,
    type: 'IDENTIFIER',
    value: 'RELINK-P-I',
  } as const

  const attribute = {
    id: 'RELINK-P-A',
    hashId: 9111,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'RELINK-P-V',
    hashId: 9112,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const rightWme = {
    timetag: 9100,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  alphaMemory.addWorkingMemoryElement(rightWme)

  assert.equal(positive.leftUnlinked, true)
  assert.equal(positive.rightUnlinked, false)
  assert.equal(
    alphaMemory.getBetaNodes().includes(positive),
    true,
  )

  const matchedTokens =
    engine.activatePositiveRight(
      positive,
      rightWme,
      new AZMatchSet(),
    )

  assert.equal(
    matchedTokens.length,
    1,
    'The existing parent token must participate in the returning right activation',
  )

  assert.equal(
    positive.leftUnlinked,
    false,
    'AZ relinks a left-unlinked positive node when right activity returns and the parent memory still has tokens',
  )

  assert.equal(
    positive.rightUnlinked,
    false,
    'The positive node must remain right-linked because its parent memory is non-empty',
  )
})

test('AZ RETE right addition right-unlinks a left-unlinked positive node when parent memory is empty ', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const linkManager = new AZDefaultReteLinkManager()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    linkManager,
  )

  const alphaMemory = new AZAlphaMemory(
    9200,
    null,
    null,
    null,
    false,
  )

  const parentMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 9201,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 9202,
    parent: parentMemory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: true,
    rightUnlinked: false,
  }

  parentMemory.children.push(positive)
  alphaMemory.addBetaNode(positive)

  const identifier = {
    id: 'RELINK-EMPTY-P-I',
    hashId: 9210,
    type: 'IDENTIFIER',
    value: 'RELINK-EMPTY-P-I',
  } as const

  const attribute = {
    id: 'RELINK-EMPTY-P-A',
    hashId: 9211,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'RELINK-EMPTY-P-V',
    hashId: 9212,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const rightWme = {
    timetag: 9200,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  alphaMemory.addWorkingMemoryElement(rightWme)

  assert.equal(
    parentMemory.tokens.length,
    0,
    'Regression precondition: parent memory must be empty',
  )
  assert.equal(positive.leftUnlinked, true)
  assert.equal(positive.rightUnlinked, false)
  assert.equal(
    alphaMemory.getBetaNodes().includes(positive),
    true,
  )

  const matchedTokens =
    engine.activatePositiveRight(
      positive,
      rightWme,
      new AZMatchSet(),
    )

  assert.equal(
    matchedTokens.length,
    0,
    'No left token exists, so right activation must not propagate',
  )

  assert.equal(
    positive.leftUnlinked,
    false,
    'AZ relinks the positive node to the left before checking whether parent memory is empty',
  )

  assert.equal(
    positive.rightUnlinked,
    true,
    'AZ right-unlinks the positive node when parent memory is empty',
  )

  assert.equal(
    alphaMemory.getBetaNodes().includes(positive),
    false,
    'A right-unlinked positive node must leave the alpha-memory beta-node list',
  )
})
