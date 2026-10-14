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
import type { AZMpNode } from '../../src/engines/cognitive/az/core/production/AZMpNode'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

test('AZ RETE right activation must not revisit a parent token when child activation inserts at the head of the same left bucket', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const linkManager = new AZDefaultReteLinkManager()

  const parentMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 100,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const alphaMemory = new AZAlphaMemory(
    200,
    null,
    null,
    null,
    false,
  )

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: null,
    parent: parentMemory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: parentMemory,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  parentMemory.tokens.push(parentToken)
  parentMemory.children.push(positive)
  alphaMemory.addBetaNode(positive)

  const parentHash = parentMemory.nodeId!
  hashIndex.insertLeft(parentToken, parentHash)

  const child: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: parentHash + hashIndex.tableSize,
    parent: positive,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  positive.children.push(child)
  alphaMemory.addBetaNode(child)

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    linkManager,
  )
  const identifier = {
    id: 'SAME-BUCKET-I',
    hashId: 301,
    type: 'IDENTIFIER',
    value: 'SAME-BUCKET-I',
  } as const

  const attribute = {
    id: 'SAME-BUCKET-A',
    hashId: 302,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'SAME-BUCKET-V',
    hashId: 303,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const rightWme = {
    timetag: 304,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  alphaMemory.addWorkingMemoryElement(rightWme)

  engine.activatePositiveRight(
    positive,
    rightWme,
    new AZMatchSet(),
  )

  assert.equal(
    child.tokens.length,
    1,
    'AZ RETE traversal must activate the MP child exactly once; a head insertion into the same physical left bucket must not cause the current parent token to be revisited',
  )
})
