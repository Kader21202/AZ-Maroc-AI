import assert from 'node:assert/strict'
import test from 'node:test'

import { AZDefaultReteActivationEngine } from '../../src/engines/cognitive/az/core/production/AZDefaultReteActivationEngine'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteHashReferentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashReferentResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import type { AZReteTest } from '../../src/engines/cognitive/az/core/production/AZReteTest'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import type { AZDummyTopNode } from '../../src/engines/cognitive/az/core/production/AZDummyTopNode'
import type { AZMemoryNode } from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type { AZMpNode } from '../../src/engines/cognitive/az/core/production/AZMpNode'
import type { AZNegativeNode } from '../../src/engines/cognitive/az/core/production/AZNegativeNode'
import type { AZCnNode } from '../../src/engines/cognitive/az/core/production/AZCnNode'
import type { AZCnPartnerToken, AZCnToken } from '../../src/engines/cognitive/az/core/production/AZCnToken'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'

test('AZ RETE activation propagates root match into memory', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    {} as never,
    {} as never,
    hashIndex,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  )

  const top: AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 1,
    parent: null,
    children: [],
    tokens: [],
  }

  const memory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 2,
    parent: top,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  top.children.push(memory)

  engine.updateNodeWithMatchesFromAbove(
    memory,
    new AZMatchSet(),
  )

  assert.equal(memory.tokens.length, 1)

  const token = memory.tokens[0]
  assert.ok(token)

  assert.ok(token.parent !== null)
  assert.equal(token.parent.parent, null)
  assert.equal(token.parent.workingMemoryElement, null)
  assert.equal(token.parent.node, null)
  assert.equal(token.parent.children.includes(token), true)
  assert.equal(token.workingMemoryElement, null)
  assert.equal(token.node, memory)
  assert.equal(token.hashReferent, null)

  assert.equal(
    hashIndex
      .getLeftBucket(memory.nodeId!)
      .includes(token),
    true,
  )
})


test('AZ RETE memory propagates through positive node', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    {
      matchesAll: () => true,
    } as never,
    {} as never,
    hashIndex,
    {} as never,
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'S1',
    hashId: 101,
    type: 'IDENTIFIER',
    value: 'S1',
  } as const

  const attribute = {
    id: 'A1',
    hashId: 102,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'V1',
    hashId: 103,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    10,
    null,
    null,
    null,
    false,
  )

  alphaMemory.addWorkingMemoryElement(wme)

  const rootMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 20,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 21,
    parent: rootMemory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  } as const

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 22,
    parent: positive,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  rootMemory.children.push(positive)
  positive.children.push(resultMemory)

  engine.activateMemoryLeft(
    rootMemory,
    null,
    null,
    new AZMatchSet(),
  )

  assert.equal(resultMemory.tokens.length, 1)

  const resultToken = resultMemory.tokens[0]
  assert.ok(resultToken)

  assert.equal(
    resultToken.workingMemoryElement,
    wme,
  )
  assert.equal(
    resultToken.parent,
    rootMemory.tokens[0],
  )
})




test('AZ RETE positive activation filters WME through RETE tests', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    {} as never,
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'I',
    hashId: 1,
    type: 'IDENTIFIER',
    value: 'I',
  } as const

  const attribute = {
    id: 'A',
    hashId: 2,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const threshold = {
    id: 'T',
    hashId: 3,
    type: 'INTEGER_CONSTANT',
    value: 5,
  } as const

  const lowValue = {
    id: 'L',
    hashId: 4,
    type: 'INTEGER_CONSTANT',
    value: 3,
  } as const

  const highValue = {
    id: 'H',
    hashId: 5,
    type: 'INTEGER_CONSTANT',
    value: 7,
  } as const

  const lowWme = {
    timetag: 1,
    identifier,
    attribute,
    value: lowValue,
    acceptable: false,
  }

  const highWme = {
    timetag: 2,
    identifier,
    attribute,
    value: highValue,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    30,
    null,
    null,
    null,
    false,
  )

  alphaMemory.addWorkingMemoryElement(lowWme)
  alphaMemory.addWorkingMemoryElement(highWme)

  const testGreater: AZReteTest = {
    rightFieldNumber: 2,
    type: 'CONSTANT_RELATIONAL',
    relationalType: 'GREATER',
    data: {
      kind: 'CONSTANT',
      symbol: threshold,
    },
    next: null,
  }

  const rootMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 31,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 32,
    parent: rootMemory,
    children: [],
    alphaMemory,
    tests: [testGreater],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 33,
    parent: positive,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  rootMemory.children.push(positive)
  positive.children.push(resultMemory)

  engine.activateMemoryLeft(
    rootMemory,
    null,
    null,
    new AZMatchSet(),
  )

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.workingMemoryElement,
    highWme,
  )
})


test('AZ RETE hashed memory resolves referent and indexes token', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    {} as never,
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {} as never,
  )

  const identifier = {
    id: 'I-HASH',
    hashId: 41,
    type: 'IDENTIFIER',
    value: 'I-HASH',
  } as const

  const attribute = {
    id: 'A-HASH',
    hashId: 42,
    type: 'STRING_CONSTANT',
    value: 'hash-attribute',
  } as const

  const value = {
    id: 'V-HASH',
    hashId: 43,
    type: 'STRING_CONSTANT',
    value: 'hash-value',
  } as const

  const currentWme = {
    timetag: 100,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: currentWme,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const memory: AZMemoryNode = {
    type: 'MEMORY',
    nodeId: 50,
    parent: null,
    children: [],
    leftHashFieldNumber: 2,
    leftHashLevelsUp: 1,
    tokens: [],
  }

  const token = engine.activateMemoryLeft(
    memory,
    parentToken,
    currentWme,
    new AZMatchSet(),
  )

  assert.equal(token.hashReferent, value)

  const expectedHash =
    memory.nodeId! ^ value.hashId

  assert.equal(
    hashIndex
      .getLeftBucket(expectedHash)
      .includes(token),
    true,
  )

  assert.equal(
    parentToken.children.includes(token),
    true,
  )
})

test('AZ RETE hashed positive activation joins matching right memory', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'HASH-ID',
    hashId: 61,
    type: 'IDENTIFIER',
    value: 'HASH-ID',
  } as const

  const attribute = {
    id: 'HASH-A',
    hashId: 62,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const leftValue = {
    id: 'HASH-L',
    hashId: 63,
    type: 'STRING_CONSTANT',
    value: 'left',
  } as const

  const rightValue = {
    id: 'HASH-R',
    hashId: 64,
    type: 'STRING_CONSTANT',
    value: 'right',
  } as const

  const leftWme = {
    timetag: 200,
    identifier,
    attribute,
    value: leftValue,
    acceptable: false,
  }

  const rightWme = {
    timetag: 201,
    identifier,
    attribute,
    value: rightValue,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    70,
    null,
    null,
    null,
    false,
  )

  const rightMemory =
    alphaMemory.addWorkingMemoryElement(
      rightWme,
    )

  assert.ok(rightMemory)

  hashIndex.insertRight(
    rightMemory,
    alphaMemory.id ^ identifier.hashId,
  )

  const hashedMemory: AZMemoryNode = {
    type: 'MEMORY',
    nodeId: 71,
    parent: null,
    children: [],
    leftHashFieldNumber: 0,
    leftHashLevelsUp: 1,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'POSITIVE',
    nodeId: 72,
    parent: hashedMemory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 73,
    parent: positive,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  hashedMemory.children.push(positive)
  positive.children.push(resultMemory)

  engine.activateMemoryLeft(
    hashedMemory,
    null,
    leftWme,
    new AZMatchSet(),
  )

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.workingMemoryElement,
    rightWme,
  )
})

test('AZ RETE positive right activation joins an existing left token', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'RIGHT-I',
    hashId: 81,
    type: 'IDENTIFIER',
    value: 'RIGHT-I',
  } as const

  const attribute = {
    id: 'RIGHT-A',
    hashId: 82,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'RIGHT-V',
    hashId: 83,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const rightWme = {
    timetag: 300,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    80,
    null,
    null,
    null,
    false,
  )

  const parentMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 81,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 82,
    parent: parentMemory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 83,
    parent: positive,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  parentMemory.children.push(positive)
  positive.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  engine.activateMemoryLeft(
    parentMemory,
    null,
    null,
    matchSet,
  )

  assert.equal(resultMemory.tokens.length, 0)

  alphaMemory.addWorkingMemoryElement(rightWme)

  const matchedLeftTokens =
    engine.activatePositiveRight(
      positive,
      rightWme,
      matchSet,
    )

  assert.equal(matchedLeftTokens.length, 1)
  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.workingMemoryElement,
    rightWme,
  )
  assert.equal(
    resultMemory.tokens[0]?.parent,
    parentMemory.tokens[0],
  )
})


test('AZ RETE unhashed MP left activation creates token and propagates matching WME', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'MP-I',
    hashId: 91,
    type: 'IDENTIFIER',
    value: 'MP-I',
  } as const

  const attribute = {
    id: 'MP-A',
    hashId: 92,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'MP-V',
    hashId: 93,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 400,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    90,
    null,
    null,
    null,
    false,
  )

  alphaMemory.addWorkingMemoryElement(wme)

  const mp: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 91,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 92,
    parent: mp,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  mp.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const mpToken = engine.activateMpLeft(
    mp,
    null,
    null,
    matchSet,
  )

  assert.equal(mp.tokens.length, 1)
  assert.equal(mp.tokens[0], mpToken)

  assert.equal(
    hashIndex
      .getLeftBucket(mp.nodeId!)
      .includes(mpToken),
    true,
  )

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.workingMemoryElement,
    wme,
  )
  assert.equal(
    resultMemory.tokens[0]?.parent,
    mpToken,
  )
})

test('AZ RETE hashed MP left activation resolves hash and joins matching WME', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'MP-H-I',
    hashId: 101,
    type: 'IDENTIFIER',
    value: 'MP-H-I',
  } as const

  const attribute = {
    id: 'MP-H-A',
    hashId: 102,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'MP-H-V',
    hashId: 103,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const leftWme = {
    timetag: 500,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const rightWme = {
    timetag: 501,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    100,
    null,
    null,
    null,
    false,
  )

  const rightMemory =
    alphaMemory.addWorkingMemoryElement(rightWme)

  if (rightMemory === null) {
    throw new Error('Expected AZ right memory')
  }

  hashIndex.insertRight(
    rightMemory,
    alphaMemory.id ^ identifier.hashId,
  )

  const mp: AZMpNode = {
    type: 'MP',
    nodeId: 101,
    parent: null,
    children: [],
    leftHashFieldNumber: 0,
    leftHashLevelsUp: 1,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 102,
    parent: mp,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  mp.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const mpToken = engine.activateMpLeft(
    mp,
    null,
    leftWme,
    matchSet,
  )

  assert.equal(
    mpToken.hashReferent,
    identifier,
  )

  assert.equal(
    hashIndex
      .getLeftBucket(
        mp.nodeId! ^ identifier.hashId,
      )
      .includes(mpToken),
    true,
  )

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.workingMemoryElement,
    rightWme,
  )
  assert.equal(
    resultMemory.tokens[0]?.parent,
    mpToken,
  )
})

test('AZ RETE unhashed MP right activation joins an existing left token', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'MP-R-I',
    hashId: 111,
    type: 'IDENTIFIER',
    value: 'MP-R-I',
  } as const

  const attribute = {
    id: 'MP-R-A',
    hashId: 112,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'MP-R-V',
    hashId: 113,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const rightWme = {
    timetag: 600,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    110,
    null,
    null,
    null,
    false,
  )

  const mp: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 111,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 112,
    parent: mp,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  mp.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const leftToken = engine.activateMpLeft(
    mp,
    null,
    null,
    matchSet,
  )

  assert.equal(resultMemory.tokens.length, 0)

  alphaMemory.addWorkingMemoryElement(rightWme)

  const matchedTokens = engine.activateMpRight(
    mp,
    rightWme,
    matchSet,
  )

  assert.equal(matchedTokens.length, 1)
  assert.equal(matchedTokens[0], leftToken)

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.workingMemoryElement,
    rightWme,
  )
  assert.equal(
    resultMemory.tokens[0]?.parent,
    leftToken,
  )
})

test('AZ RETE hashed MP right activation joins matching existing left token', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'MP-RH-I',
    hashId: 121,
    type: 'IDENTIFIER',
    value: 'MP-RH-I',
  } as const

  const attribute = {
    id: 'MP-RH-A',
    hashId: 122,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'MP-RH-V',
    hashId: 123,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const leftWme = {
    timetag: 700,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const rightWme = {
    timetag: 701,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    120,
    null,
    null,
    null,
    false,
  )

  const mp: AZMpNode = {
    type: 'MP',
    nodeId: 121,
    parent: null,
    children: [],
    leftHashFieldNumber: 0,
    leftHashLevelsUp: 1,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 122,
    parent: mp,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  mp.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const leftToken = engine.activateMpLeft(
    mp,
    null,
    leftWme,
    matchSet,
  )

  assert.equal(leftToken.hashReferent, identifier)
  assert.equal(resultMemory.tokens.length, 0)

  const matchedTokens = engine.activateMpRight(
    mp,
    rightWme,
    matchSet,
  )

  assert.equal(matchedTokens.length, 1)
  assert.equal(matchedTokens[0], leftToken)

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.workingMemoryElement,
    rightWme,
  )
  assert.equal(
    resultMemory.tokens[0]?.parent,
    leftToken,
  )
})


test('AZ RETE unhashed negative left propagates when no negative match exists', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const alphaMemory = new AZAlphaMemory(
    130,
    null,
    null,
    null,
    false,
  )

  const negative: AZNegativeNode = {
    type: 'UNHASHED_NEGATIVE',
    nodeId: 131,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 132,
    parent: negative,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  negative.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const negativeToken =
    engine.activateNegativeLeft(
      negative,
      null,
      null,
      matchSet,
    )

  assert.equal(negative.tokens.length, 1)
  assert.equal(negative.tokens[0], negativeToken)
  assert.equal(
    negativeToken.negativeMatches.length,
    0,
  )

  assert.equal(
    hashIndex
      .getLeftBucket(negative.nodeId!)
      .includes(negativeToken),
    true,
  )

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.parent,
    negativeToken,
  )
})

test('AZ RETE unhashed negative left blocks propagation when a negative match exists', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'NEG-I',
    hashId: 141,
    type: 'IDENTIFIER',
    value: 'NEG-I',
  } as const

  const attribute = {
    id: 'NEG-A',
    hashId: 142,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'NEG-V',
    hashId: 143,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const negativeWme = {
    timetag: 800,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    140,
    null,
    null,
    null,
    false,
  )

  alphaMemory.addWorkingMemoryElement(
    negativeWme,
  )

  const negative: AZNegativeNode = {
    type: 'UNHASHED_NEGATIVE',
    nodeId: 141,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 142,
    parent: negative,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  negative.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const negativeToken =
    engine.activateNegativeLeft(
      negative,
      null,
      null,
      matchSet,
    )

  assert.equal(
    negativeToken.negativeMatches.length,
    1,
  )

  assert.equal(
    negativeToken
      .negativeMatches[0]
      ?.workingMemoryElement,
    negativeWme,
  )

  assert.equal(
    resultMemory.tokens.length,
    0,
  )
})

test('AZ RETE negative right activation blocks an existing propagated branch', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const removedTokens: AZToken[] = []

  const tokenRemovalManager = {
    removeTokenAndSubtree(
      token: AZToken,
      _matchSet: AZMatchSet,
    ) {
      removedTokens.push(token)

      if (token.parent !== null) {
        const index =
          token.parent.children.indexOf(token)

        if (index >= 0) {
          token.parent.children.splice(index, 1)
        }
      }

      if (
        token.node !== null &&
        'tokens' in token.node
      ) {
        const index =
          token.node.tokens.indexOf(token)

        if (index >= 0) {
          token.node.tokens.splice(index, 1)
        }
      }
    },
  }

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    tokenRemovalManager as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'NEG-R-I',
    hashId: 151,
    type: 'IDENTIFIER',
    value: 'NEG-R-I',
  } as const

  const attribute = {
    id: 'NEG-R-A',
    hashId: 152,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'NEG-R-V',
    hashId: 153,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const negativeWme = {
    timetag: 900,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    150,
    null,
    null,
    null,
    false,
  )

  const negative: AZNegativeNode = {
    type: 'UNHASHED_NEGATIVE',
    nodeId: 151,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 152,
    parent: negative,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  negative.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const negativeToken =
    engine.activateNegativeLeft(
      negative,
      null,
      null,
      matchSet,
    )

  assert.equal(negativeToken.children.length, 1)
  assert.equal(resultMemory.tokens.length, 1)

  alphaMemory.addWorkingMemoryElement(
    negativeWme,
  )

  const matchedTokens =
    engine.activateNegativeRight(
      negative,
      negativeWme,
      matchSet,
    )

  assert.equal(matchedTokens.length, 1)
  assert.equal(matchedTokens[0], negativeToken)

  assert.equal(
    negativeToken.negativeMatches.length,
    1,
  )

  assert.equal(
    negativeToken
      .negativeMatches[0]
      ?.workingMemoryElement,
    negativeWme,
  )

  assert.equal(removedTokens.length, 1)
  assert.equal(resultMemory.tokens.length, 0)
  assert.equal(negativeToken.children.length, 0)
})

test('AZ RETE hashed negative right activation blocks matching existing branch', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const removedTokens: AZToken[] = []

  const tokenRemovalManager = {
    removeTokenAndSubtree(
      token: AZToken,
      _matchSet: AZMatchSet,
    ) {
      removedTokens.push(token)

      if (token.parent !== null) {
        const index = token.parent.children.indexOf(token)
        if (index >= 0) {
          token.parent.children.splice(index, 1)
        }
      }

      if (
        token.node !== null &&
        'tokens' in token.node
      ) {
        const index = token.node.tokens.indexOf(token)
        if (index >= 0) {
          token.node.tokens.splice(index, 1)
        }
      }
    },
  }

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    tokenRemovalManager as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'NEG-H-I',
    hashId: 161,
    type: 'IDENTIFIER',
    value: 'NEG-H-I',
  } as const

  const attribute = {
    id: 'NEG-H-A',
    hashId: 162,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'NEG-H-V',
    hashId: 163,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const leftWme = {
    timetag: 1000,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const negativeWme = {
    timetag: 1001,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    160,
    null,
    null,
    null,
    false,
  )

  const negative: AZNegativeNode = {
    type: 'NEGATIVE',
    nodeId: 161,
    parent: null,
    children: [],
    leftHashFieldNumber: 0,
    leftHashLevelsUp: 1,
    alphaMemory,
    tests: [],
    tokens: [],
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 162,
    parent: negative,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  negative.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const negativeToken =
    engine.activateNegativeLeft(
      negative,
      null,
      leftWme,
      matchSet,
    )

  assert.equal(
    negativeToken.hashReferent,
    identifier,
  )

  assert.equal(resultMemory.tokens.length, 1)

  const matchedTokens =
    engine.activateNegativeRight(
      negative,
      negativeWme,
      matchSet,
    )

  assert.equal(matchedTokens.length, 1)
  assert.equal(matchedTokens[0], negativeToken)
  assert.equal(
    negativeToken.negativeMatches.length,
    1,
  )
  assert.equal(resultMemory.tokens.length, 0)
  assert.equal(removedTokens.length, 1)
})

test('AZ RETE WME removal reactivates negative branch when last negative match disappears', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'NEG-REM-I',
    hashId: 171,
    type: 'IDENTIFIER',
    value: 'NEG-REM-I',
  } as const

  const attribute = {
    id: 'NEG-REM-A',
    hashId: 172,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'NEG-REM-V',
    hashId: 173,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const negativeWme = {
    timetag: 1100,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    170,
    null,
    null,
    null,
    false,
  )

  alphaMemory.addWorkingMemoryElement(
    negativeWme,
  )

  const negative: AZNegativeNode = {
    type: 'UNHASHED_NEGATIVE',
    nodeId: 171,
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

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 172,
    parent: negative,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  negative.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const negativeToken =
    engine.activateNegativeLeft(
      negative,
      null,
      null,
      matchSet,
    )

  assert.equal(
    negativeToken.negativeMatches.length,
    1,
  )
  assert.equal(resultMemory.tokens.length, 0)

  const removed =
    alphaMemory.removeWorkingMemoryElement(
      negativeWme,
    )

  assert.equal(removed, true)

  engine.removeWorkingMemoryElement(
    negativeWme,
    [alphaMemory],
    matchSet,
  )

  assert.equal(
    negativeToken.negativeMatches.length,
    0,
  )

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.parent,
    negativeToken,
  )
})
test('AZ RETE hashed negative left is immediately blocked by existing right memory', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    {} as never,
    {
      isRightUnlinked: () => false,
      linkRight: () => {},
      unlinkRight: () => {},
      linkPositiveLeft: () => {},
      unlinkPositiveLeft: () => {},
      isPositiveLeftUnlinked: () => false,
      linkMpLeft: () => {},
      unlinkMpLeft: () => {},
      isMpLeftUnlinked: () => false,
    } as never,
  )

  const identifier = {
    id: 'NEG-LEFT-H-I',
    hashId: 181,
    type: 'IDENTIFIER',
    value: 'NEG-LEFT-H-I',
  } as const

  const attribute = {
    id: 'NEG-LEFT-H-A',
    hashId: 182,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'NEG-LEFT-H-V',
    hashId: 183,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const leftWme = {
    timetag: 1100,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const rightWme = {
    timetag: 1101,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    180,
    null,
    null,
    null,
    false,
  )

  const rightMemory =
    alphaMemory.addWorkingMemoryElement(rightWme)

  assert.ok(rightMemory)

  hashIndex.insertRight(
    rightMemory,
    alphaMemory.id ^ identifier.hashId,
  )

  const negative: AZNegativeNode = {
    type: 'NEGATIVE',
    nodeId: 181,
    parent: null,
    children: [],
    leftHashFieldNumber: 0,
    leftHashLevelsUp: 1,
    alphaMemory,
    tests: [],
    tokens: [],
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 182,
    parent: negative,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  negative.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const negativeToken =
    engine.activateNegativeLeft(
      negative,
      null,
      leftWme,
      matchSet,
    )

  assert.equal(negativeToken.node, negative)
  assert.equal(
    negativeToken.workingMemoryElement,
    leftWme,
  )
  assert.equal(
    negativeToken.hashReferent,
    identifier,
  )

  assert.equal(
    negative.tokens.includes(negativeToken),
    true,
  )

  assert.equal(
    hashIndex
      .getLeftBucket(
        negative.nodeId! ^ identifier.hashId,
      )
      .includes(negativeToken),
    true,
  )

  assert.equal(
    negativeToken.negativeMatches.length,
    1,
  )

  const negativeMatch =
    negativeToken.negativeMatches[0]

  assert.equal(
    negativeMatch?.leftToken,
    negativeToken,
  )
  assert.equal(
    negativeMatch?.workingMemoryElement,
    rightWme,
  )
  assert.equal(
    negativeMatch?.node,
    negative,
  )

  assert.equal(resultMemory.tokens.length, 0)
})
test('AZ RETE WME removal removes positive descendants and left-unlinks empty alpha memory', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  let positiveLeftUnlinked = false

  const tokenRemovalManager = {
    removeTokenAndSubtree(
      token: AZToken,
      _matchSet: AZMatchSet,
    ) {
      if (token.parent !== null) {
        const parentIndex =
          token.parent.children.indexOf(token)

        if (parentIndex >= 0) {
          token.parent.children.splice(
            parentIndex,
            1,
          )
        }
      }

      if (
        token.node !== null &&
        'tokens' in token.node
      ) {
        const nodeIndex =
          token.node.tokens.indexOf(token)

        if (nodeIndex >= 0) {
          token.node.tokens.splice(
            nodeIndex,
            1,
          )
        }
      }
    },
  }

  const engine =
    new AZDefaultReteActivationEngine(
      new AZDefaultReteTestMatcher(),
      {} as never,
      hashIndex,
      new AZDefaultReteHashReferentResolver(),
      tokenRemovalManager as never,
      {} as never,
      {
        isRightUnlinked: () => false,
        linkRight: () => {},
        unlinkRight: () => {},
        linkPositiveLeft: () => {},
        unlinkPositiveLeft: () => {
          positiveLeftUnlinked = true
        },
        isPositiveLeftUnlinked: () => false,
        linkMpLeft: () => {},
        unlinkMpLeft: () => {},
        isMpLeftUnlinked: () => false,
      } as never,
    )

  const identifier = {
    id: 'REM-P-I',
    hashId: 181,
    type: 'IDENTIFIER',
    value: 'REM-P-I',
  } as const

  const attribute = {
    id: 'REM-P-A',
    hashId: 182,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'REM-P-V',
    hashId: 183,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1200,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    180,
    null,
    null,
    null,
    false,
  )

  alphaMemory.addWorkingMemoryElement(wme)

  const parentMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 181,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 182,
    parent: parentMemory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  parentMemory.children.push(positive)
  alphaMemory.addBetaNode(positive)

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 183,
    parent: positive,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  positive.children.push(resultMemory)

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: parentMemory,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  parentMemory.tokens.push(parentToken)

  const matchSet = new AZMatchSet()

  engine.activatePositiveLeft(
    positive,
    parentToken,
    matchSet,
  )

  assert.equal(resultMemory.tokens.length, 1)

  alphaMemory.removeWorkingMemoryElement(wme)

  engine.removeWorkingMemoryElement(
    wme,
    [alphaMemory],
    matchSet,
  )

  assert.equal(resultMemory.tokens.length, 0)
  assert.equal(parentToken.children.length, 0)
  assert.equal(positiveLeftUnlinked, true)
})

test('AZ RETE WME removal removes MP descendants and left-unlinks empty alpha memory', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  let mpLeftUnlinked = false

  const tokenRemovalManager = {
    removeTokenAndSubtree(
      token: AZToken,
      _matchSet: AZMatchSet,
    ) {
      if (token.parent !== null) {
        const parentIndex =
          token.parent.children.indexOf(token)

        if (parentIndex >= 0) {
          token.parent.children.splice(
            parentIndex,
            1,
          )
        }
      }

      if (
        token.node !== null &&
        'tokens' in token.node
      ) {
        const nodeIndex =
          token.node.tokens.indexOf(token)

        if (nodeIndex >= 0) {
          token.node.tokens.splice(
            nodeIndex,
            1,
          )
        }
      }
    },
  }

  const engine =
    new AZDefaultReteActivationEngine(
      new AZDefaultReteTestMatcher(),
      {} as never,
      hashIndex,
      new AZDefaultReteHashReferentResolver(),
      tokenRemovalManager as never,
      {} as never,
      {
        isRightUnlinked: () => false,
        linkRight: () => {},
        unlinkRight: () => {},
        linkPositiveLeft: () => {},
        unlinkPositiveLeft: () => {},
        isPositiveLeftUnlinked: () => false,
        linkMpLeft: () => {},
        unlinkMpLeft: () => {
          mpLeftUnlinked = true
        },
        isMpLeftUnlinked: () => false,
      } as never,
    )

  const identifier = {
    id: 'REM-MP-I',
    hashId: 191,
    type: 'IDENTIFIER',
    value: 'REM-MP-I',
  } as const

  const attribute = {
    id: 'REM-MP-A',
    hashId: 192,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'REM-MP-V',
    hashId: 193,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1300,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const alphaMemory = new AZAlphaMemory(
    190,
    null,
    null,
    null,
    false,
  )

  alphaMemory.addWorkingMemoryElement(wme)

  const mp: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 191,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  alphaMemory.addBetaNode(mp)

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 192,
    parent: mp,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  mp.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  engine.activateMpLeft(
    mp,
    null,
    null,
    matchSet,
  )

  assert.equal(mp.tokens.length, 1)
  assert.equal(resultMemory.tokens.length, 1)

  alphaMemory.removeWorkingMemoryElement(wme)

  engine.removeWorkingMemoryElement(
    wme,
    [alphaMemory],
    matchSet,
  )

  assert.equal(resultMemory.tokens.length, 0)
  assert.equal(mp.tokens.length, 1)
  assert.equal(mp.tokens[0]?.children.length, 0)
  assert.equal(mpLeftUnlinked, true)
})

test('AZ RETE CN left activation creates indexed CN token and propagates', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const tokenIdentityManager =
    new AZDefaultReteTokenIdentityManager()

  const engine =
    new AZDefaultReteActivationEngine(
      {} as never,
      {} as never,
      hashIndex,
      {} as never,
      {} as never,
      tokenIdentityManager,
      {} as never,
    )

  const identifier = {
    id: 'CN-I',
    hashId: 201,
    type: 'IDENTIFIER',
    value: 'CN-I',
  } as const

  const attribute = {
    id: 'CN-A',
    hashId: 202,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'CN-V',
    hashId: 203,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1400,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const parentMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 200,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: wme,
    node: parentMemory,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  parentMemory.tokens.push(parentToken)

  const cn: AZCnNode = {
    type: 'CN',
    nodeId: 201,
    parent: parentMemory,
    children: [],
    partner: null,
    tokens: [],
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 202,
    parent: cn,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  cn.children.push(resultMemory)

  const parentIdentity =
    tokenIdentityManager.getIdentity(
      parentToken,
    )

  const expectedHash =
    cn.nodeId! ^
    parentIdentity ^
    wme.timetag

  const matchSet = new AZMatchSet()

  const cnToken = engine.activateCnLeft(
    cn,
    parentToken,
    wme,
    matchSet,
  ) as AZCnToken

  assert.equal(cn.tokens.length, 1)
  assert.equal(cn.tokens[0], cnToken)

  assert.equal(cnToken.parent, parentToken)
  assert.equal(
    cnToken.workingMemoryElement,
    wme,
  )
  assert.equal(cnToken.node, cn)
  assert.equal(cnToken.hashReferent, null)
  assert.deepEqual(
    cnToken.negativeMatches,
    [],
  )
  assert.deepEqual(
    cnToken.cnPartnerTokens,
    [],
  )

  assert.equal(
    parentToken.children.includes(cnToken),
    true,
  )

  assert.equal(
    hashIndex
      .getLeftBucket(expectedHash)
      .includes(cnToken),
    true,
  )

  assert.equal(resultMemory.tokens.length, 1)
  assert.equal(
    resultMemory.tokens[0]?.parent,
    cnToken,
  )
})

test('AZ RETE CN partner blocks an existing propagated CN branch', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const tokenIdentityManager =
    new AZDefaultReteTokenIdentityManager()

  let removedToken: AZToken | null = null

  const tokenRemovalManager = {
    removeTokenAndSubtree: (
      token: AZToken,
    ) => {
      removedToken = token

      const parent = token.parent

      if (parent !== null) {
        const index =
          parent.children.indexOf(token)

        if (index >= 0) {
          parent.children.splice(index, 1)
        }
      }
    },
  }

  const engine =
    new AZDefaultReteActivationEngine(
      {} as never,
      {} as never,
      hashIndex,
      {} as never,
      tokenRemovalManager as never,
      tokenIdentityManager,
      {} as never,
    )

  const identifier = {
    id: 'NCC-I',
    hashId: 301,
    type: 'IDENTIFIER',
    value: 'NCC-I',
  } as const

  const attribute = {
    id: 'NCC-A',
    hashId: 302,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'NCC-V',
    hashId: 303,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1500,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const commonParent: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 300,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: wme,
    node: commonParent,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  commonParent.tokens.push(parentToken)

  const cn: AZCnNode = {
    type: 'CN',
    nodeId: 301,
    parent: commonParent,
    children: [],
    partner: null,
    tokens: [],
  }

  const cnPartner: AZCnNode = {
    type: 'CN_PARTNER',
    nodeId: 302,
    parent: commonParent,
    children: [],
    partner: cn,
    tokens: [],
  }

  cn.partner = cnPartner

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 303,
    parent: cn,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  cn.children.push(resultMemory)

  const matchSet = new AZMatchSet()

  const cnToken =
    engine.activateCnLeft(
      cn,
      parentToken,
      wme,
      matchSet,
    ) as AZCnToken

  assert.equal(cnToken.children.length, 1)

  const propagatedChild =
    cnToken.children[0]

  assert.ok(propagatedChild)

  const blocker =
    engine.activateCnPartnerLeft(
      cnPartner,
      parentToken,
      wme,
      matchSet,
    )

  assert.equal(cnPartner.tokens.length, 1)
  assert.equal(
    cnPartner.tokens[0],
    blocker,
  )

  assert.equal(
    blocker.parent,
    parentToken,
  )

  assert.equal(
    blocker.workingMemoryElement,
    wme,
  )

  assert.equal(
    blocker.node,
    cnPartner,
  )

  assert.equal(
    parentToken.children.includes(blocker),
    true,
  )

  assert.equal(
    cnToken.cnPartnerTokens.length,
    1,
  )

  assert.equal(
    cnToken.cnPartnerTokens[0],
    blocker,
  )

  assert.equal(
    (blocker as { leftToken?: AZToken })
      .leftToken,
    cnToken,
  )

  assert.equal(
    removedToken,
    propagatedChild,
  )

  assert.equal(
    cnToken.children.length,
    0,
  )
})

test('AZ RETE CN partner creates a blocked CN token when partner arrives first', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const tokenIdentityManager =
    new AZDefaultReteTokenIdentityManager()

  const engine =
    new AZDefaultReteActivationEngine(
      {} as never,
      {} as never,
      hashIndex,
      {} as never,
      {
        removeTokenAndSubtree: () => {},
      } as never,
      tokenIdentityManager,
      {} as never,
    )

  const identifier = {
    id: 'NCC-FIRST-I',
    hashId: 401,
    type: 'IDENTIFIER',
    value: 'NCC-FIRST-I',
  } as const

  const attribute = {
    id: 'NCC-FIRST-A',
    hashId: 402,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'NCC-FIRST-V',
    hashId: 403,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1600,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const commonParent: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 400,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: wme,
    node: commonParent,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  commonParent.tokens.push(parentToken)

  const cn: AZCnNode = {
    type: 'CN',
    nodeId: 401,
    parent: commonParent,
    children: [],
    partner: null,
    tokens: [],
  }

  const cnPartner: AZCnNode = {
    type: 'CN_PARTNER',
    nodeId: 402,
    parent: commonParent,
    children: [],
    partner: cn,
    tokens: [],
  }

  cn.partner = cnPartner

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 403,
    parent: cn,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  cn.children.push(resultMemory)

  const blocker =
    engine.activateCnPartnerLeft(
      cnPartner,
      parentToken,
      wme,
      new AZMatchSet(),
    )

  assert.equal(cn.tokens.length, 1)

  const cnToken =
    cn.tokens[0] as AZCnToken

  assert.equal(cnToken.parent, parentToken)
  assert.equal(
    cnToken.workingMemoryElement,
    wme,
  )
  assert.equal(cnToken.node, cn)

  assert.equal(
    cnToken.cnPartnerTokens.length,
    1,
  )

  assert.equal(
    cnToken.cnPartnerTokens[0],
    blocker,
  )

  assert.equal(
    (blocker as { leftToken?: AZToken })
      .leftToken,
    cnToken,
  )

  assert.equal(
    resultMemory.tokens.length,
    0,
  )

  assert.equal(
    cnToken.children.length,
    0,
  )

  const expectedHash =
    cn.nodeId! ^
    tokenIdentityManager.getIdentity(
      parentToken,
    ) ^
    wme.timetag

  assert.equal(
    hashIndex
      .getLeftBucket(expectedHash)
      .includes(cnToken),
    true,
  )

  const cnTokenAfterPartner =
    engine.activateCnLeft(
      cn,
      parentToken,
      wme,
      new AZMatchSet(),
    ) as AZCnToken

  assert.equal(
    cnTokenAfterPartner,
    cnToken,
    'AZ invariant: CN activation after partner-first must reuse the existing blocked CN token',
  )

  assert.equal(
    cn.tokens.length,
    1,
    'AZ invariant: CN activation after partner-first must not create a duplicate CN token',
  )

  assert.equal(
    cnToken.cnPartnerTokens.length,
    1,
    'AZ invariant: the existing CN blocker must remain attached after duplicate CN activation',
  )

  assert.equal(
    cnToken.cnPartnerTokens[0],
    blocker,
  )

  assert.equal(
    resultMemory.tokens.length,
    0,
    'AZ invariant: duplicate CN activation must not propagate while the CN token remains blocked',
  )

  assert.equal(
    cnToken.children.length,
    0,
  )
})

test('AZ RETE general left flow dispatches into CN', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const tokenIdentityManager =
    new AZDefaultReteTokenIdentityManager()

  const alphaMemory = new AZAlphaMemory(
    504,
    null,
    null,
    null,
    false,
  )

  const identifier = {
    id: 'CN-DISPATCH-I',
    hashId: 504,
    type: 'IDENTIFIER',
    value: 'CN-DISPATCH-I',
  } as const

  const attribute = {
    id: 'CN-DISPATCH-A',
    hashId: 505,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'CN-DISPATCH-V',
    hashId: 506,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1500,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  alphaMemory.addWorkingMemoryElement(wme)

  const engine =
    new AZDefaultReteActivationEngine(
      {
        matchesAll: () => true,
      } as never,
      {} as never,
      hashIndex,
      {} as never,
      {} as never,
      tokenIdentityManager,
      new AZDefaultReteLinkManager(),
    )

  const top: AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 500,
    parent: null,
    children: [],
    tokens: [],
  }

  const memory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 501,
    parent: top,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 502,
    parent: memory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const cn: AZCnNode = {
    type: 'CN',
    nodeId: 503,
    parent: positive,
    children: [],
    partner: null,
    tokens: [],
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 504,
    parent: cn,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  top.children.push(memory)
  memory.children.push(positive)
  positive.children.push(cn)
  cn.children.push(resultMemory)

  engine.updateNodeWithMatchesFromAbove(
    memory,
    new AZMatchSet(),
  )

  assert.equal(memory.tokens.length, 1)
  assert.equal(cn.tokens.length, 1)
  assert.equal(resultMemory.tokens.length, 1)

  const cnToken =
    cn.tokens[0] as AZCnToken

  assert.equal(
    cnToken.parent,
    memory.tokens[0],
  )

  assert.equal(
    cnToken.workingMemoryElement,
    wme,
  )

  assert.equal(
    resultMemory.tokens[0]?.parent,
    cnToken,
  )
})
test('AZ RETE general left flow dispatches into CN partner and blocks CN branch', () => {
  const hashIndex = new AZDefaultReteHashIndex()
  const tokenIdentityManager =
    new AZDefaultReteTokenIdentityManager()

  let removedToken: AZToken | null = null

  const tokenRemovalManager = {
    removeTokenAndSubtree: (token: AZToken) => {
      removedToken = token

      if (token.parent !== null) {
        token.parent.children =
          token.parent.children.filter(
            child => child !== token,
          )
      }

      if (
        token.node !== null &&
        'tokens' in token.node
      ) {
        token.node.tokens =
          token.node.tokens.filter(
            candidate => candidate !== token,
          )
      }
    },
  }

  const alphaMemory = new AZAlphaMemory(
    605,
    null,
    null,
    null,
    false,
  )

  const identifier = {
    id: 'CN-PARTNER-DISPATCH-I',
    hashId: 605,
    type: 'IDENTIFIER',
    value: 'CN-PARTNER-DISPATCH-I',
  } as const

  const attribute = {
    id: 'CN-PARTNER-DISPATCH-A',
    hashId: 606,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'CN-PARTNER-DISPATCH-V',
    hashId: 607,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1600,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  alphaMemory.addWorkingMemoryElement(wme)

  const engine =
    new AZDefaultReteActivationEngine(
      {
        matchesAll: () => true,
      } as never,
      {} as never,
      hashIndex,
      {} as never,
      tokenRemovalManager as never,
      tokenIdentityManager,
      new AZDefaultReteLinkManager(),
    )

  const top: AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 600,
    parent: null,
    children: [],
    tokens: [],
  }

  const memory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 601,
    parent: top,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 602,
    parent: memory,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const cn: AZCnNode = {
    type: 'CN',
    nodeId: 603,
    parent: positive,
    children: [],
    partner: null,
    tokens: [],
  }

  const cnPartner: AZCnNode = {
    type: 'CN_PARTNER',
    nodeId: 604,
    parent: positive,
    children: [],
    partner: cn,
    tokens: [],
  }

  cn.partner = cnPartner

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 605,
    parent: cn,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  top.children.push(memory)
  memory.children.push(positive)

  /*
   * Order matters:
   * CN propagates first,
   * then CN_PARTNER blocks that branch.
   */
  positive.children.push(cn)
  positive.children.push(cnPartner)
  cn.children.push(resultMemory)

  engine.updateNodeWithMatchesFromAbove(
    memory,
    new AZMatchSet(),
  )

  assert.equal(memory.tokens.length, 1)
  assert.equal(cn.tokens.length, 1)
  assert.equal(cnPartner.tokens.length, 1)

  const cnToken =
    cn.tokens[0] as AZCnToken

  const blocker =
    cnPartner.tokens[0] as AZCnPartnerToken

  assert.equal(
    cnToken.parent,
    memory.tokens[0],
  )

  assert.equal(
    cnToken.workingMemoryElement,
    wme,
  )

  assert.equal(blocker.leftToken, cnToken)

  assert.equal(
    cnToken.cnPartnerTokens.includes(blocker),
    true,
  )

  assert.notEqual(
    removedToken,
    null,
  )

  assert.equal(
    resultMemory.tokens.length,
    0,
  )

  assert.equal(
    cnToken.children.length,
    0,
  )
})
test('AZ RETE general left flow dispatches into unhashed MP', () => {
  const positiveAlphaMemory = new AZAlphaMemory(
    700,
    null,
    null,
    null,
    false,
  )

  const mpAlphaMemory = new AZAlphaMemory(
    701,
    null,
    null,
    null,
    false,
  )

  const identifier = {
    id: 'MP-DISPATCH-I',
    hashId: 701,
    type: 'IDENTIFIER',
    value: 'MP-DISPATCH-I',
  } as const

  const attribute = {
    id: 'MP-DISPATCH-A',
    hashId: 702,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'MP-DISPATCH-V',
    hashId: 703,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const positiveWme = {
    timetag: 1699,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  const mpWme = {
    timetag: 1700,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  positiveAlphaMemory.addWorkingMemoryElement(
    positiveWme,
  )

  mpAlphaMemory.addWorkingMemoryElement(
    mpWme,
  )

  const engine =
    new AZDefaultReteActivationEngine(
      {
        matchesAll: () => true,
      } as never,
      {} as never,
      new AZDefaultReteHashIndex(),
      {} as never,
      {} as never,
      new AZDefaultReteTokenIdentityManager(),
      new AZDefaultReteLinkManager(),
    )

  const top: AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 700,
    parent: null,
    children: [],
    tokens: [],
  }

  const memory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 701,
    parent: top,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 702,
    parent: memory,
    children: [],
    alphaMemory: positiveAlphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const mp: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 703,
    parent: positive,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory: mpAlphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 704,
    parent: mp,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  top.children.push(memory)
  memory.children.push(positive)
  positive.children.push(mp)
  mp.children.push(resultMemory)

  engine.updateNodeWithMatchesFromAbove(
    memory,
    new AZMatchSet(),
  )

  assert.equal(memory.tokens.length, 1)
  assert.equal(mp.tokens.length, 1)
  assert.equal(resultMemory.tokens.length, 1)

  assert.equal(
    mp.tokens[0]?.workingMemoryElement,
    positiveWme,
  )

  assert.equal(
    resultMemory.tokens[0]?.workingMemoryElement,
    mpWme,
  )
})
test('AZ RETE general left flow dispatches into unhashed negative', () => {
  const hashIndex = new AZDefaultReteHashIndex()

  const positiveAlphaMemory = new AZAlphaMemory(
    800,
    null,
    null,
    null,
    false,
  )

  const negativeAlphaMemory = new AZAlphaMemory(
    801,
    null,
    null,
    null,
    false,
  )

  const identifier = {
    id: 'NEG-DISPATCH-I',
    hashId: 801,
    type: 'IDENTIFIER',
    value: 'NEG-DISPATCH-I',
  } as const

  const attribute = {
    id: 'NEG-DISPATCH-A',
    hashId: 802,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'NEG-DISPATCH-V',
    hashId: 803,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const positiveWme = {
    timetag: 1800,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  positiveAlphaMemory.addWorkingMemoryElement(
    positiveWme,
  )

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    {} as never,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    new AZDefaultReteTokenIdentityManager(),
    new AZDefaultReteLinkManager(),
  )

  const top: AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 800,
    parent: null,
    children: [],
    tokens: [],
  }

  const memory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 801,
    parent: top,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const positive: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 802,
    parent: memory,
    children: [],
    alphaMemory: positiveAlphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const negative: AZNegativeNode = {
    type: 'UNHASHED_NEGATIVE',
    nodeId: 803,
    parent: positive,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory: negativeAlphaMemory,
    tests: [],
    tokens: [],
    rightUnlinked: false,
  }

  const resultMemory: AZMemoryNode = {
    type: 'UNHASHED_MEMORY',
    nodeId: 804,
    parent: negative,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  top.children.push(memory)
  memory.children.push(positive)
  positive.children.push(negative)
  negative.children.push(resultMemory)

  engine.updateNodeWithMatchesFromAbove(
    memory,
    new AZMatchSet(),
  )

  assert.equal(memory.tokens.length, 1)
  assert.equal(negative.tokens.length, 1)

  assert.equal(
    negative.tokens[0]?.negativeMatches.length,
    0,
  )

  assert.equal(resultMemory.tokens.length, 1)

  assert.equal(
    negative.tokens[0]?.workingMemoryElement,
    positiveWme,
  )

  assert.equal(
    resultMemory.tokens[0]?.parent,
    negative.tokens[0],
  )
})
test('AZ RETE general left flow dispatches into production node', () => {
  const calls: unknown[][] = []

  const productionActivator = {
    activate: (...args: unknown[]) => {
      calls.push(args)

      return {
        parent: args[1],
        workingMemoryElement: args[2],
        node: args[0],
        hashReferent: null,
        negativeMatches: [],
        children: [],
      } as never
    },
  }

  const engine = new AZDefaultReteActivationEngine(
    {} as never,
    productionActivator as never,
    new AZDefaultReteHashIndex(),
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  )

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const productionNode = {
    type: 'PRODUCTION' as const,
    nodeId: 900,
    parent: null,
    children: [],
    production: {} as never,
    tokens: [],
  }

  const matchSet = new AZMatchSet()

  const dispatcher = engine as unknown as {
    activateChildLeft(
      child: never,
      parentToken: AZToken,
      workingMemoryElement: null,
      matchSet: AZMatchSet,
    ): void
  }

  dispatcher.activateChildLeft(
    productionNode as never,
    parentToken,
    null,
    matchSet,
  )

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.[0], productionNode)
  assert.equal(calls[0]?.[1], parentToken)
  assert.equal(calls[0]?.[2], null)
  assert.equal(calls[0]?.[3], matchSet)
})
test('AZ RETE general left flow propagates MP through negative into production', () => {
  const calls: unknown[][] = []

  const productionActivator = {
    activate: (...args: unknown[]) => {
      calls.push(args)

      return {
        parent: args[1],
        workingMemoryElement: args[2],
        node: args[0],
        hashReferent: null,
        negativeMatches: [],
        children: [],
      } as never
    },
  }

  const mpAlphaMemory = new AZAlphaMemory(
    910,
    null,
    null,
    null,
    false,
  )

  const negativeAlphaMemory = new AZAlphaMemory(
    911,
    null,
    null,
    null,
    false,
  )

  const identifier = {
    id: 'MP-NEG-PROD-I',
    hashId: 910,
    type: 'IDENTIFIER',
    value: 'MP-NEG-PROD-I',
  } as const

  const attribute = {
    id: 'MP-NEG-PROD-A',
    hashId: 911,
    type: 'STRING_CONSTANT',
    value: 'attribute',
  } as const

  const value = {
    id: 'MP-NEG-PROD-V',
    hashId: 912,
    type: 'STRING_CONSTANT',
    value: 'value',
  } as const

  const wme = {
    timetag: 1910,
    identifier,
    attribute,
    value,
    acceptable: false,
  }

  mpAlphaMemory.addWorkingMemoryElement(wme)

  const engine = new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    productionActivator as never,
    new AZDefaultReteHashIndex(),
    new AZDefaultReteHashReferentResolver(),
    {} as never,
    new AZDefaultReteTokenIdentityManager(),
    new AZDefaultReteLinkManager(),
  )

  const top: AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 910,
    parent: null,
    children: [],
    tokens: [],
  }

  const mp: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 911,
    parent: top,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory: mpAlphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const negative: AZNegativeNode = {
    type: 'UNHASHED_NEGATIVE',
    nodeId: 912,
    parent: mp,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory: negativeAlphaMemory,
    tests: [],
    tokens: [],
    rightUnlinked: false,
  }

  const productionNode = {
    type: 'PRODUCTION' as const,
    nodeId: 913,
    parent: negative,
    children: [],
    production: {} as never,
    tokens: [],
  }

  top.children.push(mp)
  mp.children.push(negative)
  negative.children.push(productionNode)

  const matchSet = new AZMatchSet()

  const mpToken = engine.activateMpLeft(
    mp,
    null,
    wme,
    matchSet,
  )

  assert.equal(mp.tokens.length, 1)
  assert.equal(mp.tokens[0], mpToken)

  assert.equal(negative.tokens.length, 1)
  assert.equal(negative.tokens[0]?.parent, mpToken)
  assert.equal(
    negative.tokens[0]?.negativeMatches.length,
    0,
  )

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.[0], productionNode)
  assert.equal(calls[0]?.[1], negative.tokens[0])
  assert.equal(calls[0]?.[2], null)
  assert.equal(calls[0]?.[3], matchSet)
})
test('AZ RETE DUMMY_MATCHES collects temporary token without assertion', () => {
  const engine = new AZDefaultReteActivationEngine(
    {} as never,
    {} as never,
    new AZDefaultReteHashIndex(),
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  )

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const dummyMatchesNode = {
    type: 'DUMMY_MATCHES' as const,
    nodeId: null,
    parent: null,
    children: [],
  }

  const matchSet = new AZMatchSet()

  const dispatcher = engine as unknown as {
    activateChildLeft(
      child: never,
      parentToken: AZToken,
      workingMemoryElement: null,
      matchSet: AZMatchSet,
    ): void

    dummyMatchTokens: readonly AZToken[]
  }

  dispatcher.activateChildLeft(
    dummyMatchesNode as never,
    parentToken,
    null,
    matchSet,
  )

  assert.equal(
    dispatcher.dummyMatchTokens.length,
    1,
  )

  const token = dispatcher.dummyMatchTokens[0]

  assert.ok(token)
  assert.equal(token.parent, parentToken)
  assert.equal(token.workingMemoryElement, null)
  assert.equal(token.node, null)
  assert.equal(token.hashReferent, null)
  assert.deepEqual(token.negativeMatches, [])
  assert.deepEqual(token.children, [])

  assert.equal(
    matchSet.hasPendingChanges(),
    false,
  )
})

test('AZ RETE update from negative parent replays only unblocked tokens', () => {
  const engine = new AZDefaultReteActivationEngine(
    {} as never,
    {} as never,
    new AZDefaultReteHashIndex(),
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  )

  const parent = {
    type: 'UNHASHED_NEGATIVE' as const,
    nodeId: 1000,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory: new AZAlphaMemory(
      1001,
      null,
      null,
      null,
      false,
    ),
    tests: null,
    tokens: [] as AZToken[],
    rightUnlinked: false,
  }

  const unblockedToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: parent as never,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const blockedToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: parent as never,
    hashReferent: null,
    negativeMatches: [
      {} as never,
    ],
    children: [],
  }

  parent.tokens.push(
    unblockedToken,
    blockedToken,
  )

  const child = {
    type: 'DUMMY_MATCHES' as const,
    nodeId: null,
    parent,
    children: [],
  }

  parent.children.push(child as never)

  const observableEngine =
    engine as unknown as {
      dummyMatchTokens: readonly AZToken[]
    }

  engine.updateNodeWithMatchesFromAbove(
    child as never,
    new AZMatchSet(),
  )

  assert.equal(
    observableEngine.dummyMatchTokens.length,
    1,
  )

  assert.equal(
    observableEngine.dummyMatchTokens[0]?.parent,
    unblockedToken,
  )
})

test('AZ RETE update from CN parent replays only unblocked CN tokens', () => {
  const engine = new AZDefaultReteActivationEngine(
    {} as never,
    {} as never,
    new AZDefaultReteHashIndex(),
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  )

  const parent = {
    type: 'CN' as const,
    nodeId: 1100,
    parent: null,
    children: [],
    partner: null,
    tokens: [] as AZToken[],
  }

  const unblockedToken = {
    parent: null,
    workingMemoryElement: null,
    node: parent,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    cnPartnerTokens: [],
  } as AZCnToken

  const blockedToken = {
    parent: null,
    workingMemoryElement: null,
    node: parent,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    cnPartnerTokens: [
      {} as AZCnPartnerToken,
    ],
  } as AZCnToken

  parent.tokens.push(
    unblockedToken,
    blockedToken,
  )

  const child = {
    type: 'DUMMY_MATCHES' as const,
    nodeId: null,
    parent,
    children: [],
  }

  parent.children.push(child as never)

  const observableEngine =
    engine as unknown as {
      dummyMatchTokens: readonly AZToken[]
    }

  engine.updateNodeWithMatchesFromAbove(
    child as never,
    new AZMatchSet(),
  )

  assert.equal(
    observableEngine.dummyMatchTokens.length,
    1,
  )

  assert.equal(
    observableEngine.dummyMatchTokens[0]?.parent,
    unblockedToken,
  )
})

test('AZ RETE update from positive parent replays alpha memory only toward new child and restores siblings', () => {
  const alphaMemory = new AZAlphaMemory(
    1200,
    null,
    null,
    null,
    false,
  )

  const wme = {
    identifier: {} as never,
    attribute: {} as never,
    value: {} as never,
    acceptable: false,
    timetag: 1201,
  }

  const rightMemory =
    alphaMemory.addWorkingMemoryElement(
      wme as never,
    )

  assert.ok(rightMemory)

  const parent: AZPositiveNode = {
    type: 'UNHASHED_POSITIVE',
    nodeId: 1202,
    parent: null,
    children: [],
    alphaMemory,
    tests: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const sibling = {
    type: 'DUMMY_MATCHES' as const,
    nodeId: null,
    parent,
    children: [],
  }

  const child = {
    type: 'DUMMY_MATCHES' as const,
    nodeId: null,
    parent,
    children: [],
  }

  parent.children.push(
    sibling as never,
    child as never,
  )

  const originalChildren =
    [...parent.children]

  const engine =
    new AZDefaultReteActivationEngine(
      {} as never,
      {} as never,
      new AZDefaultReteHashIndex(),
      {} as never,
      {} as never,
      {} as never,
      {
        isRightUnlinked: () => false,
      } as never,
    )

  const replayedWmes: unknown[] = []
  const visibleChildren: unknown[][] = []

  engine.activatePositiveRight = (
    replayParent,
    replayWme,
  ) => {
    assert.equal(
      replayParent,
      parent,
    )

    replayedWmes.push(replayWme)
    visibleChildren.push(
      [...replayParent.children],
    )

    return []
  }

  engine.updateNodeWithMatchesFromAbove(
    child as never,
    new AZMatchSet(),
  )

  assert.equal(
    replayedWmes.length,
    1,
  )

  assert.equal(
    replayedWmes[0],
    wme,
  )

  assert.deepEqual(
    visibleChildren[0],
    [child],
  )

  assert.deepEqual(
    parent.children,
    originalChildren,
  )

  assert.equal(
    parent.children[0],
    sibling,
  )

  assert.equal(
    parent.children[1],
    child,
  )
})

test('AZ RETE update from MP parent replays alpha memory only toward new child and restores siblings', () => {
  const alphaMemory = new AZAlphaMemory(
    1300,
    null,
    null,
    null,
    false,
  )

  const wme = {
    identifier: {} as never,
    attribute: {} as never,
    value: {} as never,
    acceptable: false,
    timetag: 1301,
  }

  const rightMemory =
    alphaMemory.addWorkingMemoryElement(
      wme as never,
    )

  assert.ok(rightMemory)

  const parent: AZMpNode = {
    type: 'UNHASHED_MP',
    nodeId: 1302,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory,
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  const sibling = {
    type: 'DUMMY_MATCHES' as const,
    nodeId: null,
    parent,
    children: [],
  }

  const child = {
    type: 'DUMMY_MATCHES' as const,
    nodeId: null,
    parent,
    children: [],
  }

  parent.children.push(
    sibling as never,
    child as never,
  )

  const originalChildren =
    [...parent.children]

  const engine =
    new AZDefaultReteActivationEngine(
      {} as never,
      {} as never,
      new AZDefaultReteHashIndex(),
      {} as never,
      {} as never,
      {} as never,
      {
        isRightUnlinked: () => false,
      } as never,
    )

  const replayedWmes: unknown[] = []
  const visibleChildren: unknown[][] = []

  engine.activateMpRight = (
    replayParent,
    replayWme,
  ) => {
    assert.equal(
      replayParent,
      parent,
    )

    replayedWmes.push(replayWme)
    visibleChildren.push(
      [...replayParent.children],
    )

    return []
  }

  engine.updateNodeWithMatchesFromAbove(
    child as never,
    new AZMatchSet(),
  )

  assert.equal(
    replayedWmes.length,
    1,
  )

  assert.equal(
    replayedWmes[0],
    wme,
  )

  assert.deepEqual(
    visibleChildren[0],
    [child],
  )

  assert.deepEqual(
    parent.children,
    originalChildren,
  )

  assert.equal(
    parent.children[0],
    sibling,
  )

  assert.equal(
    parent.children[1],
    child,
  )
})

test('AZ RETE unhashed memory propagates only to linked unhashed positive children', () => {
  const memoryNode = {
    type: 'UNHASHED_MEMORY' as const,
    nodeId: 1400,
    parent: null,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    tokens: [],
  }

  const invalidMpChild = {
    type: 'UNHASHED_MP' as const,
    nodeId: 1401,
    parent: memoryNode,
    children: [],
    leftHashFieldNumber: null,
    leftHashLevelsUp: null,
    alphaMemory: new AZAlphaMemory(
      1402,
      null,
      null,
      null,
      false,
    ),
    tests: [],
    tokens: [],
    leftUnlinked: false,
    rightUnlinked: false,
  }

  memoryNode.children.push(
    invalidMpChild as never,
  )

  const engine =
    new AZDefaultReteActivationEngine(
      {} as never,
      {} as never,
      new AZDefaultReteHashIndex(),
      {} as never,
      {} as never,
      {} as never,
      new AZDefaultReteLinkManager(),
    )

  engine.activateMemoryLeft(
    memoryNode as never,
    null,
    null,
    new AZMatchSet(),
  )

  assert.equal(
    invalidMpChild.tokens.length,
    0,
    'UNHASHED_MEMORY must not directly activate an UNHASHED_MP child',
  )
})

