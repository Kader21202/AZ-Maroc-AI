import assert from 'node:assert/strict'
import test from 'node:test'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultAlphaMemoryManager } from '../../src/engines/cognitive/az/core/production/AZDefaultAlphaMemoryManager'
import { AZDefaultNegativeConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZNegativeConditionBuilder'
import { AZDefaultReteActivationEngine } from '../../src/engines/cognitive/az/core/production/AZDefaultReteActivationEngine'
import { AZDefaultReteHashExtractor } from '../../src/engines/cognitive/az/core/production/AZReteHashExtractor'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteHashReferentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashReferentResolver'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import { AZDefaultReteTestBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestBuilder'
import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZMemoryNode } from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type { AZNegativeNode } from '../../src/engines/cognitive/az/core/production/AZNegativeNode'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'

test(
  'AZ RETE enforces negative right-unlink and relink semantics',
  () => {
    const symbolManager =
      new AZSymbolManager()

    const workingMemory =
      new AZWorkingMemory()

    const hashIndex =
      new AZDefaultReteHashIndex()

    const alphaMemoryManager =
      new AZDefaultAlphaMemoryManager(
        workingMemory,
        hashIndex,
      )

    const nodeFactory =
      new AZDefaultReteNodeFactory()

    const bindings =
      new AZDefaultVariableBindingManager()

    const testBuilder =
      new AZDefaultReteTestBuilder(
        bindings,
      )

    const linkManager =
      new AZDefaultReteLinkManager()

    const matchSet =
      new AZMatchSet()

    /*
     * The builder only needs the initial replay operation
     * here. The parent intentionally has no matches, so
     * replay produces no negative token.
     */
    const initialReplayEngine = {
      updateNodeWithMatchesFromAbove() {
        // Deliberately no parent matches.
      },
    }

    const builder =
      new AZDefaultNegativeConditionBuilder(
        bindings,
        testBuilder,
        new AZDefaultReteHashExtractor(),
        alphaMemoryManager,
        nodeFactory,
        initialReplayEngine as never,
        matchSet,
        linkManager,
      )

    const identifierVariable =
      symbolManager.makeVariable('<s>')

    const attribute =
      symbolManager.makeStringConstant(
        'blocked',
      )

    const value =
      symbolManager.makeStringConstant(
        'yes',
      )

    const condition: AZProductionCondition = {
      type: 'NEGATIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: identifierVariable,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: attribute,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: value,
      },
      acceptable: false,
    }

    const dummyTop =
      nodeFactory.createDummyTopNode()

    const builtNode =
      builder.build(
        condition,
        1,
        dummyTop,
      )

    assert.equal(
      builtNode.type,
      'UNHASHED_NEGATIVE',
    )

    const negative =
      builtNode as AZNegativeNode

    /*
     * AZ RETE invariant:
     * no tokens arrived from above -> unlink from
     * right memory.
     */
    assert.equal(
      negative.tokens.length,
      0,
    )

    assert.equal(
      negative.rightUnlinked,
      true,
    )

    assert.equal(
      negative.alphaMemory
        .getBetaNodes()
        .includes(negative),
      false,
    )

    /*
     * A matching right-side WME appears while the
     * negative node is right-unlinked.
     */
    const identifier =
      symbolManager.makeIdentifier(
        'S',
      )

    const negativeWme = {
      timetag: 9001,
      identifier,
      attribute,
      value,
      acceptable: false,
    }

    negative.alphaMemory
      .addWorkingMemoryElement(
        negativeWme,
      )

    const resultMemory: AZMemoryNode = {
      type: 'UNHASHED_MEMORY',
      nodeId: 9002,
      parent: negative,
      children: [],
      leftHashFieldNumber: null,
      leftHashLevelsUp: null,
      tokens: [],
    }

    negative.children.push(
      resultMemory,
    )

    const activationEngine =
      new AZDefaultReteActivationEngine(
        new AZDefaultReteTestMatcher(),
        {} as never,
        hashIndex,
        new AZDefaultReteHashReferentResolver(),
        {} as never,
        {} as never,
        linkManager,
      )

    /*
     * AZ RETE invariant:
     * a new left activation relinks the node before
     * checking existing right memories.
     */
    const token =
      activationEngine.activateNegativeLeft(
        negative,
        null,
        null,
        matchSet,
      )

    assert.equal(
      negative.rightUnlinked,
      false,
    )

    assert.equal(
      negative.alphaMemory
        .getBetaNodes()
        .includes(negative),
      true,
    )

    /*
     * The WME that appeared while right-unlinked
     * must still be discovered after relinking.
     */
    assert.equal(
      token.negativeMatches.length,
      1,
    )

    assert.equal(
      token.negativeMatches[0]
        ?.workingMemoryElement,
      negativeWme,
    )

    /*
     * Because the negative condition is blocked,
     * propagation below the negative node must not
     * occur.
     */
    assert.equal(
      resultMemory.tokens.length,
      0,
    )
  },
)

console.log(
  'AZ RETE negative right-unlink/relink: OK',
)