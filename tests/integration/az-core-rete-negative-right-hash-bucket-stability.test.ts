import assert from 'node:assert/strict'
import test from 'node:test'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteActivationEngine } from '../../src/engines/cognitive/az/core/production/AZDefaultReteActivationEngine'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteHashReferentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashReferentResolver'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZMemoryNode } from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type { AZNegativeNode } from '../../src/engines/cognitive/az/core/production/AZNegativeNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

test(
  'AZ RETE negative right activation remains stable when descendant removal mutates the same left hash bucket',
  () => {
    const hashIndex = new AZDefaultReteHashIndex()
    const identityManager =
      new AZDefaultReteTokenIdentityManager()

    const linkManager = new AZDefaultReteLinkManager()

    const productionActivator = {
      activate() {
        throw new Error(
          'Production activation is not expected',
        )
      },
    }

    const removalManager =
      new AZDefaultReteTokenRemovalManager(
        hashIndex,
        identityManager,
        productionActivator as never,
        linkManager,
      )

    const engine =
      new AZDefaultReteActivationEngine(
        new AZDefaultReteTestMatcher(),
        {} as never,
        hashIndex,
        new AZDefaultReteHashReferentResolver(),
        removalManager,
        identityManager,
        linkManager,
      )

    /*
     * nodeId ^ hashId = 1
     *
     * The descendant will use hash 16385.
     * Both therefore occupy physical bucket 1:
     *
     * 1     & 16383 = 1
     * 16385 & 16383 = 1
     */
    const identifier = {
      id: 'COLLISION-I',
      hashId: 100,
      type: 'IDENTIFIER',
      value: 'COLLISION-I',
    } as const

    const attribute = {
      id: 'COLLISION-A',
      hashId: 101,
      type: 'STRING_CONSTANT',
      value: 'blocked',
    } as const

    const value = {
      id: 'COLLISION-V',
      hashId: 102,
      type: 'STRING_CONSTANT',
      value: 'yes',
    } as const

    const leftWme = {
      timetag: 1,
      identifier,
      attribute,
      value,
      acceptable: false,
    }

    const rightWme = {
      timetag: 2,
      identifier,
      attribute,
      value,
      acceptable: false,
    }

    const alphaMemory =
      new AZAlphaMemory(
        1,
        null,
        null,
        null,
        false,
      )

    const negative: AZNegativeNode = {
      type: 'NEGATIVE',
      nodeId: identifier.hashId ^ 1,
      parent: null,
      children: [],
      leftHashFieldNumber: 0,
      leftHashLevelsUp: 1,
      alphaMemory,
      tests: [],
      tokens: [],
      rightUnlinked: false,
    }

    const matchSet = new AZMatchSet()

    /*
     * Two independent negative tokens with the same
     * hash referent enter physical bucket 1.
     */
    const tokenA =
      engine.activateNegativeLeft(
        negative,
        null,
        leftWme,
        matchSet,
      )

    const tokenB =
      engine.activateNegativeLeft(
        negative,
        null,
        leftWme,
        matchSet,
      )

    const negativeHash =
      negative.nodeId! ^ identifier.hashId

    assert.equal(negativeHash, 1)

    /*
     * Create a real MEMORY descendant under tokenB.
     * Its logical hash is 16385, which collides with
     * the negative tokens in physical bucket 1.
     */
    const descendantNode: AZMemoryNode = {
      type: 'MEMORY',
      nodeId: 16385 ^ identifier.hashId,
      parent: negative,
      children: [],
      leftHashFieldNumber: 0,
      leftHashLevelsUp: 1,
      tokens: [],
    }

    const descendant: AZToken = {
      parent: tokenB,
      workingMemoryElement: null,
      node: descendantNode,
      hashReferent: identifier,
      negativeMatches: [],
      children: [],
    }

    tokenB.children.push(descendant)
    descendantNode.tokens.push(descendant)

    const descendantHash =
      descendantNode.nodeId! ^
      identifier.hashId

    assert.equal(descendantHash, 16385)

    /*
     * insertLeft uses unshift(), so the bucket becomes:
     *
     * [ descendant, tokenB, tokenA ]
     *
     * tokenB owns the colliding descendant. Removing it
     * while tokenB is being processed mutates the same
     * physical bucket before tokenA is visited.
     */

    hashIndex.insertLeft(
      descendant,
      descendantHash,
    )

    const bucketBefore =
      hashIndex.getLeftBucket(negativeHash)

    assert.equal(
      bucketBefore.includes(tokenA),
      true,
    )
    assert.equal(
      bucketBefore.includes(tokenB),
      true,
    )
    assert.equal(
      bucketBefore.includes(descendant),
      true,
    )

    const matchedTokens =
      engine.activateNegativeRight(
        negative,
        rightWme,
        matchSet,
      )

    /*
     * Both negative tokens match the same right WME.
     * Removing the colliding descendant must not make
     * iteration skip either negative token.
     */
    assert.equal(matchedTokens.length, 2)

    assert.equal(
      tokenA.negativeMatches.length,
      1,
    )

    assert.equal(
      tokenB.negativeMatches.length,
      1,
    )

    assert.equal(descendant.node, null)

    console.log(
      'AZ RETE negative-right hash-bucket mutation stability: OK',
    )
  },
)


