import assert from 'node:assert/strict'
import test from 'node:test'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteActivationEngine } from '../../src/engines/cognitive/az/core/production/AZDefaultReteActivationEngine'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteHashReferentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashReferentResolver'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZMpNode } from '../../src/engines/cognitive/az/core/production/AZMpNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

test('AZ RETE right addition relinks a left-unlinked MP node ', () => {
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
    9300,
    null,
    null,
    null,
    false,
  )

  const mp: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 9301,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: true,
    rightUnlinked: false,
  }

  alphaMemory.addBetaNode(mp)

  const leftToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: mp,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  mp.tokens.push(leftToken)
  hashIndex.insertLeft(
    leftToken,
    mp.nodeId!,
  )

  const identifier = {
    id: 'RELINK-MP-I',
    hashId: 9310,
    type: 'IDENTIFIER',
    value: 'RELINK-MP-I',
  } as const

  const attribute = {
    id: 'RELINK-MP-A',
    hashId: 9311,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'RELINK-MP-V',
    hashId: 9312,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const rightWme = {
    timetag: 9300,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  alphaMemory.addWorkingMemoryElement(rightWme)

  assert.equal(mp.leftUnlinked, true)
  assert.equal(mp.rightUnlinked, false)

  const matchedTokens =
    engine.activateMpRight(
      mp,
      rightWme,
      new AZMatchSet(),
    )

  assert.equal(
    matchedTokens.length,
    1,
    'The existing MP token must participate in the returning right activation',
  )

  assert.equal(
    matchedTokens[0],
    leftToken,
  )

  assert.equal(
    mp.leftUnlinked,
    false,
    'AZ makes a left-unlinked MP node left-linked when right activity returns and the MP still has tokens',
  )

  assert.equal(
    mp.rightUnlinked,
    false,
    'The MP node must remain right-linked because it still has tokens',
  )
})

test('AZ RETE right addition right-unlinks a left-unlinked MP node when it has no tokens', () => {
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
    9400,
    null,
    null,
    null,
    false,
  )

  const mp: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 9401,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: true,
    rightUnlinked: false,
  }

  alphaMemory.addBetaNode(mp)

  const identifier = {
    id: 'RELINK-EMPTY-MP-I',
    hashId: 9410,
    type: 'IDENTIFIER',
    value: 'RELINK-EMPTY-MP-I',
  } as const

  const attribute = {
    id: 'RELINK-EMPTY-MP-A',
    hashId: 9411,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'RELINK-EMPTY-MP-V',
    hashId: 9412,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const rightWme = {
    timetag: 9400,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  alphaMemory.addWorkingMemoryElement(rightWme)

  assert.equal(mp.tokens.length, 0)
  assert.equal(mp.leftUnlinked, true)
  assert.equal(mp.rightUnlinked, false)
  assert.equal(
    alphaMemory.getBetaNodes().includes(mp),
    true,
  )

  const matchedTokens =
    engine.activateMpRight(
      mp,
      rightWme,
      new AZMatchSet(),
    )

  assert.equal(
    matchedTokens.length,
    0,
    'No MP token exists, so right activation must not propagate',
  )

  assert.equal(
    mp.leftUnlinked,
    false,
    'AZ makes the MP left-linked before checking whether it has tokens',
  )

  assert.equal(
    mp.rightUnlinked,
    true,
    'AZ right-unlinks the MP when it has no tokens',
  )

  assert.equal(
    alphaMemory.getBetaNodes().includes(mp),
    false,
    'A right-unlinked MP must leave the alpha-memory beta-node list',
  )
})
