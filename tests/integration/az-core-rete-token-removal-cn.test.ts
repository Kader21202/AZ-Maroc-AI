import assert from 'node:assert/strict'

import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZCnNode } from '../../src/engines/cognitive/az/core/production/AZCnNode'
import type { AZCnPartnerToken, AZCnToken } from '../../src/engines/cognitive/az/core/production/AZCnToken'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZProductionNodeActivator'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZMemoryNode } from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

{
  const production: AZProduction = {
    name: 'cn-reactivation',
    declaredSupport: 'I_SUPPORT',
    conditions: [],
    actions: [],
    instantiations: [],
  }

  const cnNode: AZCnNode = {
    type: 'CN',
    nodeId: 501,
    parent: null,
    children: [],
    partner: null,
    tokens: [],
  }

  const partnerNode: AZCnNode = {
    type: 'CN_PARTNER',
    nodeId: 502,
    parent: null,
    children: [],
    partner: cnNode,
    tokens: [],
  }

  cnNode.partner = partnerNode

  const productionNode: AZProductionNode = {
    type: 'PRODUCTION',
    nodeId: 503,
    parent: cnNode,
    children: [],
    production,
    tokens: [],
  }

  cnNode.children.push(productionNode)

  const leftToken: AZCnToken = {
    parent: null,
    workingMemoryElement: null,
    node: cnNode,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    cnPartnerTokens: [],
  }

  cnNode.tokens.push(leftToken)

  const blockerParent1: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const blockerParent2: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const blocker1: AZCnPartnerToken = {
    parent: blockerParent1,
    workingMemoryElement: null,
    node: partnerNode,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    leftToken,
  }

  const blocker2: AZCnPartnerToken = {
    parent: blockerParent2,
    workingMemoryElement: null,
    node: partnerNode,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    leftToken,
  }

  blockerParent1.children.push(blocker1)
  blockerParent2.children.push(blocker2)
  partnerNode.tokens.push(blocker1, blocker2)
  leftToken.cnPartnerTokens.push(blocker1, blocker2)

  let activationCount = 0

  const activator: AZProductionNodeActivator = {
    activate(
      node,
      parentToken,
      workingMemoryElement,
    ) {
      activationCount += 1

      assert.equal(node, productionNode)
      assert.equal(parentToken, leftToken)
      assert.equal(workingMemoryElement, null)

      const token: AZToken = {
        parent: parentToken,
        workingMemoryElement,
        node,
        hashReferent: null,
        negativeMatches: [],
        children: [],
      }

      return token
    },
  }

  const manager =
    new AZDefaultReteTokenRemovalManager(
      new AZDefaultReteHashIndex(),
      new AZDefaultReteTokenIdentityManager(),
      activator,
      new AZDefaultReteLinkManager(),
    )

  manager.removeTokenAndSubtree(
    blocker1,
    new AZMatchSet(),
  )

  assert.equal(leftToken.cnPartnerTokens.length, 1)
  assert.equal(leftToken.cnPartnerTokens[0], blocker2)
  assert.equal(activationCount, 0)
  assert.equal(blocker1.node, null)
  assert.equal(partnerNode.tokens.length, 1)
  assert.equal(blockerParent1.children.length, 0)

  manager.removeTokenAndSubtree(
    blocker2,
    new AZMatchSet(),
  )

  assert.equal(leftToken.cnPartnerTokens.length, 0)
  assert.equal(activationCount, 1)
  assert.equal(blocker2.node, null)
  assert.equal(partnerNode.tokens.length, 0)
  assert.equal(blockerParent2.children.length, 0)
}

{
  const goal = symbol('G')

  const wme: AZWorkingMemoryElement = {
    timetag: 601,
    identifier: goal,
    attribute: symbol('A'),
    value: symbol('V'),
    acceptable: false,
  }

  const cnNode: AZCnNode = {
    type: 'CN',
    nodeId: 602,
    parent: null,
    children: [],
    partner: null,
    tokens: [],
  }

  const partnerNode: AZCnNode = {
    type: 'CN_PARTNER',
    nodeId: 603,
    parent: null,
    children: [],
    partner: cnNode,
    tokens: [],
  }

  cnNode.partner = partnerNode

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const cnToken: AZCnToken = {
    parent: parentToken,
    workingMemoryElement: wme,
    node: cnNode,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    cnPartnerTokens: [],
  }

  parentToken.children.push(cnToken)
  cnNode.tokens.push(cnToken)

  const blockerParent: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const blocker: AZCnPartnerToken = {
    parent: blockerParent,
    workingMemoryElement: null,
    node: partnerNode,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    leftToken: cnToken,
  }

  blockerParent.children.push(blocker)
  partnerNode.tokens.push(blocker)
  cnToken.cnPartnerTokens.push(blocker)

  const hashIndex =
    new AZDefaultReteHashIndex()

  const identities =
    new AZDefaultReteTokenIdentityManager()

  const hash =
    cnNode.nodeId! ^
    identities.getIdentity(parentToken) ^
    wme.timetag

  hashIndex.insertLeft(
    cnToken,
    hash,
  )

  const activator: AZProductionNodeActivator = {
    activate() {
      throw new Error(
        'Production activation is not expected while removing CN token',
      )
    },
  }

  const manager =
    new AZDefaultReteTokenRemovalManager(
      hashIndex,
      identities,
      activator,
      new AZDefaultReteLinkManager(),
    )

  manager.removeTokenAndSubtree(
    cnToken,
    new AZMatchSet(),
  )

  assert.equal(
    hashIndex
      .getLeftBucket(hash)
      .includes(cnToken),
    false,
  )

  assert.equal(cnToken.node, null)
  assert.equal(cnNode.tokens.includes(cnToken), false)
  assert.equal(parentToken.children.includes(cnToken), false)
  assert.equal(cnToken.cnPartnerTokens.length, 0)

  assert.equal(blocker.node, null)
  assert.equal(partnerNode.tokens.length, 0)
  assert.equal(blockerParent.children.length, 0)
}

{
  const cnNode: AZCnNode = {
    type: 'CN',
    nodeId: 701,
    parent: null,
    children: [],
    partner: null,
    tokens: [],
  }

  const partnerNode: AZCnNode = {
    type: 'CN_PARTNER',
    nodeId: 702,
    parent: null,
    children: [],
    partner: cnNode,
    tokens: [],
  }

  cnNode.partner = partnerNode

  const memoryNode: AZMemoryNode = {
    type: 'MEMORY',
    nodeId: 703,
    parent: cnNode,
    children: [],
    tokens: [],
    leftHashFieldNumber: 0,
    leftHashLevelsUp: 1,
  }

  cnNode.children.push(memoryNode)

  const leftToken: AZCnToken = {
    parent: null,
    workingMemoryElement: null,
    node: cnNode,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    cnPartnerTokens: [],
  }

  cnNode.tokens.push(leftToken)

  const blockerParent: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const blocker: AZCnPartnerToken = {
    parent: blockerParent,
    workingMemoryElement: null,
    node: partnerNode,
    hashReferent: null,
    negativeMatches: [],
    children: [],
    leftToken,
  }

  blockerParent.children.push(blocker)
  partnerNode.tokens.push(blocker)
  leftToken.cnPartnerTokens.push(blocker)

  const activator: AZProductionNodeActivator = {
    activate() {
      throw new Error(
        'Direct production activation is not expected for CN -> MEMORY reactivation',
      )
    },
  }

  const manager =
    new AZDefaultReteTokenRemovalManager(
      new AZDefaultReteHashIndex(),
      new AZDefaultReteTokenIdentityManager(),
      activator,
      new AZDefaultReteLinkManager(),
    )

  manager.setChildLeftActivator({
    activateChildLeft(
      child,
      parentToken,
      workingMemoryElement,
    ): void {
      if (child !== memoryNode) {
        throw new Error(
          'Unexpected child during CN -> MEMORY reactivation',
        )
      }

      const token: AZToken = {
        parent: parentToken,
        workingMemoryElement,
        node: memoryNode,
        hashReferent: null,
        negativeMatches: [],
        children: [],
      }

      memoryNode.tokens.push(token)

      if (parentToken !== null) {
        parentToken.children.push(token)
      }
    },
  })
  manager.removeTokenAndSubtree(
    blocker,
    new AZMatchSet(),
  )

  assert.equal(
    leftToken.cnPartnerTokens.length,
    0,
  )

  assert.equal(
    memoryNode.tokens.length,
    1,
    'Removing the last CN blocker must reactivate a MEMORY child',
  )
}
console.log(
  'AZ core RETE token removal manager: CN + CN_PARTNER OK',
)

