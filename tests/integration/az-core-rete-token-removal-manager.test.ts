import assert from 'node:assert/strict'

import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZMemoryNode } from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZProductionNodeActivator'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const productionNodeActivator: AZProductionNodeActivator = {
  activate() {
    throw new Error(
      'Production activation is not expected in this test',
    )
  },
}

{
  const hashReferent = symbol('H')

  const parentNode: AZMemoryNode = {
    type: 'MEMORY',
    nodeId: 101,
    parent: null,
    children: [],
    tokens: [],
    leftHashFieldNumber: 0,
    leftHashLevelsUp: 1,
  }

  const childNode: AZMemoryNode = {
    type: 'MEMORY',
    nodeId: 202,
    parent: parentNode,
    children: [],
    tokens: [],
    leftHashFieldNumber: 0,
    leftHashLevelsUp: 1,
  }

  parentNode.children.push(childNode)

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: parentNode,
    hashReferent,
    negativeMatches: [],
    children: [],
  }

  const childToken: AZToken = {
    parent: parentToken,
    workingMemoryElement: null,
    node: childNode,
    hashReferent,
    negativeMatches: [],
    children: [],
  }

  parentToken.children.push(childToken)
  parentNode.tokens.push(parentToken)
  childNode.tokens.push(childToken)

  const hashIndex =
    new AZDefaultReteHashIndex()

  hashIndex.insertLeft(
    parentToken,
    parentNode.nodeId! ^ hashReferent.hashId,
  )

  hashIndex.insertLeft(
    childToken,
    childNode.nodeId! ^ hashReferent.hashId,
  )

  const manager =
    new AZDefaultReteTokenRemovalManager(
      hashIndex,
      new AZDefaultReteTokenIdentityManager(),
      productionNodeActivator,
      new AZDefaultReteLinkManager(),
    )

  manager.removeTokenAndSubtree(
    parentToken,
    new AZMatchSet(),
  )

  assert.equal(parentToken.node, null)
  assert.equal(childToken.node, null)

  assert.equal(parentToken.children.length, 0)
  assert.equal(childToken.children.length, 0)

  assert.equal(parentNode.tokens.length, 0)
  assert.equal(childNode.tokens.length, 0)

  assert.equal(
    hashIndex.getLeftBucket(
      parentNode.nodeId! ^ hashReferent.hashId,
    ).includes(parentToken),
    false,
  )

  assert.equal(
    hashIndex.getLeftBucket(
      childNode.nodeId! ^ hashReferent.hashId,
    ).includes(childToken),
    false,
  )
}

{
  const production: AZProduction = {
    name: 'pending-assertion-production',
    declaredSupport: 'O_SUPPORT',
    conditions: [],
    actions: [],
    instantiations: [],
  }

  const node: AZProductionNode = {
    type: 'PRODUCTION',
    nodeId: 301,
    parent: null,
    children: [],
    production,
    tokens: [],
  }

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const token: AZToken = {
    parent: parentToken,
    workingMemoryElement: null,
    node,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  node.tokens.push(token)
  parentToken.children.push(token)

  const matchSet = new AZMatchSet()

  matchSet.addAssertion({
    type: 'O_ASSERTION',
    production,
    token,
    wme: null,
    matchGoal: null,
    matchGoalLevel: 0,
  })

  assert.equal(
    matchSet.hasPendingChanges(),
    true,
  )

  const manager =
    new AZDefaultReteTokenRemovalManager(
      new AZDefaultReteHashIndex(),
      new AZDefaultReteTokenIdentityManager(),
      productionNodeActivator,
      new AZDefaultReteLinkManager(),
    )

  manager.removeTokenAndSubtree(
    token,
    matchSet,
  )

  assert.equal(
    matchSet.hasPendingChanges(),
    false,
  )

  assert.equal(token.node, null)
  assert.equal(node.tokens.length, 0)
  assert.equal(parentToken.children.length, 0)
}

{
  const goal = symbol('S')

  const wme: AZWorkingMemoryElement = {
    timetag: 401,
    identifier: goal,
    attribute: symbol('A'),
    value: symbol('V'),
    acceptable: false,
  }

  const production: AZProduction = {
    name: 'retraction-production',
    declaredSupport: 'I_SUPPORT',
    conditions: [],
    actions: [],
    instantiations: [],
  }

  const node: AZProductionNode = {
    type: 'PRODUCTION',
    nodeId: 402,
    parent: null,
    children: [],
    production,
    tokens: [],
  }

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const token: AZToken = {
    parent: parentToken,
    workingMemoryElement: wme,
    node,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const instantiation: AZInstantiation = {
    id: 1,
    production,
    instantiatedConditions: [],
    matchGoal: goal,
    matchGoalLevel: 1,
    inMatchSet: true,
    generatedPreferences: [],
    reteToken: parentToken,
    reteWme: wme,
  }

  production.instantiations.push(
    instantiation,
  )

  node.tokens.push(token)
  parentToken.children.push(token)

  const matchSet = new AZMatchSet()

  const manager =
    new AZDefaultReteTokenRemovalManager(
      new AZDefaultReteHashIndex(),
      new AZDefaultReteTokenIdentityManager(),
      productionNodeActivator,
      new AZDefaultReteLinkManager(),
    )

  manager.removeTokenAndSubtree(
    token,
    matchSet,
  )

  assert.equal(
    instantiation.reteToken,
    null,
  )

  assert.equal(
    instantiation.reteWme,
    null,
  )

  assert.equal(
    matchSet.hasPendingChanges(),
    true,
  )

  assert.equal(
    matchSet.takeNextRetraction(goal),
    instantiation,
  )

  assert.equal(
    matchSet.hasPendingChanges(),
    false,
  )
}

console.log(
  'AZ core RETE token removal manager: subtree + production OK',
)
