import assert from 'node:assert/strict'
import test from 'node:test'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultAlphaMemoryManager } from '../../src/engines/cognitive/az/core/production/AZDefaultAlphaMemoryManager'
import { AZDefaultWorkingMemoryReteMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultWorkingMemoryReteMatcher'
import { AZDefaultReteActivationEngine } from '../../src/engines/cognitive/az/core/production/AZDefaultReteActivationEngine'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteHashReferentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashReferentResolver'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZDummyTopNode } from '../../src/engines/cognitive/az/core/production/AZDummyTopNode'
import type { AZMemoryNode } from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import type { AZMpNode } from '../../src/engines/cognitive/az/core/production/AZMpNode'

test('AZ RETE preserves same-alpha ancestor ordering semantics', () => {
  const symbols = new AZSymbolManager()
  const workingMemory = new AZWorkingMemory()
  const hashIndex = new AZDefaultReteHashIndex()
  const alphaMemoryManager =
    new AZDefaultAlphaMemoryManager(
      workingMemory,
      hashIndex,
    )

  const alpha =
    alphaMemoryManager.findOrCreate(
      null,
      null,
      null,
      false,
    )

  const linkManager =
    new AZDefaultReteLinkManager()

  const matchSet = new AZMatchSet()

  const engine =
    new AZDefaultReteActivationEngine(
      new AZDefaultReteTestMatcher(),
      {} as never,
      hashIndex,
      new AZDefaultReteHashReferentResolver(),
      {} as never,
      new AZDefaultReteTokenIdentityManager(),
      linkManager,
    )

  const matcher =
    new AZDefaultWorkingMemoryReteMatcher(
      alphaMemoryManager,
      engine,
      matchSet,
    )

  const top: AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 9100,
    parent: null,
    children: [],
    tokens: [],
  }

  const memory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 9101,
    parent: top,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const ancestor: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 9102,
    parent: memory,
    children: [],
    alphaMemory: alpha,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const descendant: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 9103,
    parent: ancestor,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory: alpha,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const result: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 9104,
    parent: descendant,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  top.children.push(memory)
  memory.children.push(ancestor)
  ancestor.children.push(descendant)
  descendant.children.push(result)

  /*
   * Registering ancestor first and descendant second exercises
   * the AZ invariant that same-alpha descendants must be kept
   * before their ancestors in the alpha-memory beta-node order.
   */
  alpha.addBetaNode(ancestor)
  alpha.addBetaNode(descendant)

  engine.updateNodeWithMatchesFromAbove(
    memory,
    matchSet,
  )

  assert.equal(memory.tokens.length, 1)
  assert.equal(ancestor.rightUnlinked, false)
  assert.equal(descendant.rightUnlinked, false)

  const wme = {
    timetag: 9105,
    identifier: symbols.makeIdentifier('S'),
    attribute: symbols.makeStringConstant('same-alpha'),
    value: symbols.makeStringConstant('yes'),
    acceptable: false,
  }

  matcher.addWorkingMemoryElement(wme)

  assert.equal(
    result.tokens.length,
    1,
    'A single WME must produce exactly one logical descendant match when ancestor and descendant share an alpha memory',
  )
})

test('AZ RETE relink skips right-unlinked same-alpha ancestors ', () => {
  const symbols = new AZSymbolManager()
  const workingMemory = new AZWorkingMemory()
  const hashIndex = new AZDefaultReteHashIndex()

  const alphaMemoryManager =
    new AZDefaultAlphaMemoryManager(
      workingMemory,
      hashIndex,
    )

  const alpha =
    alphaMemoryManager.findOrCreate(
      null,
      null,
      null,
      false,
    )

  const linkManager =
    new AZDefaultReteLinkManager()

  const top: AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 9200,
    parent: null,
    children: [],
    tokens: [],
  }

  const firstMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 9201,
    parent: top,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const outer: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 9202,
    parent: firstMemory,
    children: [],
    alphaMemory: alpha,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const middle: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 9203,
    parent: outer,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory: alpha,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const secondMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 9204,
    parent: middle,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const inner: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 9205,
    parent: secondMemory,
    children: [],
    alphaMemory: alpha,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  top.children.push(firstMemory)
  firstMemory.children.push(outer)
  outer.children.push(middle)
  middle.children.push(secondMemory)
  secondMemory.children.push(inner)

  alpha.addBetaNode(outer)
  alpha.addBetaNode(middle)
  alpha.addBetaNode(inner)

  assert.deepEqual(
    alpha.getBetaNodes(),
    [inner, middle, outer],
  )

  linkManager.unlinkRight(middle)

  assert.deepEqual(
    alpha.getBetaNodes(),
    [inner, outer],
  )

  linkManager.unlinkRight(inner)

  assert.deepEqual(
    alpha.getBetaNodes(),
    [outer],
  )

  /*
   * AZ follows nearest_ancestor_with_same_am
   * past right-unlinked ancestors.  Therefore relinking
   * inner must skip middle and place inner immediately
   * before the still-linked outer ancestor.
   */
  linkManager.linkRight(inner)

  assert.deepEqual(
    alpha.getBetaNodes(),
    [inner, outer],
  )

  assert.equal(
    middle.rightUnlinked,
    true,
  )

  assert.equal(
    inner.rightUnlinked,
    false,
  )
})
