import assert from 'node:assert/strict'

import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
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
      'Production activation is not expected in this regression',
    )
  },
}

const goal = symbol('S')

const production: AZProduction = {
  name: 'retraction-order-production',
  declaredSupport: 'I_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
}

const node: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 902,
  parent: null,
  children: [],
  production,
  tokens: [],
}

const makeMatch = (
  id: number,
  timetag: number,
): {
  parentToken: AZToken
  token: AZToken
  instantiation: AZInstantiation
} => {
  const wme: AZWorkingMemoryElement = {
    timetag,
    identifier: goal,
    attribute: symbol(`A${id}`),
    value: symbol(`V${id}`),
    acceptable: false,
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
    id,
    production,
    instantiatedConditions: [],
    matchGoal: goal,
    matchGoalLevel: 1,
    inMatchSet: true,
    generatedPreferences: [],
    reteToken: parentToken,
    reteWme: wme,
  }

  production.instantiations.push(instantiation)
  node.tokens.push(token)
  parentToken.children.push(token)

  return {
    parentToken,
    token,
    instantiation,
  }
}

const first = makeMatch(1, 901)
const second = makeMatch(2, 902)

const matchSet = new AZMatchSet()

const manager =
  new AZDefaultReteTokenRemovalManager(
    new AZDefaultReteHashIndex(),
    new AZDefaultReteTokenIdentityManager(),
    productionNodeActivator,
    new AZDefaultReteLinkManager(),
  )

manager.removeTokenAndSubtree(
  first.token,
  matchSet,
)

manager.removeTokenAndSubtree(
  second.token,
  matchSet,
)

/*
 * Official AZ inserts new retractions at the head
 * of the goal retraction list and consumes from that
 * head. Therefore two successive retractions R1, R2
 * must be consumed R2, then R1.
 */
assert.equal(
  matchSet.takeNextRetraction(goal),
  second.instantiation,
  'AZ invariant: the most recently created retraction for a goal must be consumed first',
)

assert.equal(
  matchSet.takeNextRetraction(goal),
  first.instantiation,
  'AZ invariant: the older retraction must be consumed after the newer one',
)

assert.equal(
  matchSet.hasPendingChanges(),
  false,
)

console.log(
  'AZ RETE production retraction ordering: OK',
)
