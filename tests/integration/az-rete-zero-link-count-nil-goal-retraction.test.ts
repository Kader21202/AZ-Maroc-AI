import assert from 'node:assert/strict'

import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
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

const goal = symbol('S')
const attribute = symbol('a')
const value = symbol('v')

const production: AZProduction = {
  name: 'nil-goal-retraction-at-creation',
  declaredSupport: 'I_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
}

const node: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 1001,
  parent: null,
  children: [],
  production,
  tokens: [],
}

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: goal,
  attribute,
  value,
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
  id: 1,
  production,
  instantiatedConditions: [],
  matchGoal: goal,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: parentToken,
  reteWme: wme,
}

production.instantiations.push(instantiation)
node.tokens.push(token)
parentToken.children.push(token)

const states =
  new AZDefaultIdentifierLinkStateRegistry()

states.register(goal, {
  linkCount: 0,
  level: 2,
})

assert.equal(
  instantiation.matchGoal,
  goal,
  'historical instantiation match goal must remain intact',
)

const productionNodeActivator: AZProductionNodeActivator = {
  activate() {
    throw new Error('unexpected production activation')
  },
}

const matchSet = new AZMatchSet()

const manager =
  new AZDefaultReteTokenRemovalManager(
    new AZDefaultReteHashIndex(),
    new AZDefaultReteTokenIdentityManager(),
    productionNodeActivator,
    new AZDefaultReteLinkManager(),
    states,
  )

manager.removeTokenAndSubtree(
  token,
  matchSet,
)

/*
 * AZ RETE invariant:
 *
 *   msc->goal = inst->match_goal;
 *   if (msc->goal->id->link_count == 0)
 *       msc->goal = NIL;
 *
 * Therefore a retraction created for an instantiation whose
 * historical match goal still exists but has linkCount == 0
 * belongs directly to the NIL-goal retraction path.
 */
assert.equal(
  matchSet.hasRetraction(goal),
  false,
  'AZ invariant: zero-link-count goal must not receive a normal retraction',
)

assert.equal(
  matchSet.takeNextNilGoalRetraction(),
  instantiation,
  'AZ invariant: zero-link-count goal retraction must be created directly as NIL-goal',
)

assert.equal(
  instantiation.matchGoal,
  goal,
  'NIL-goal classification must not erase the historical instantiation match goal',
)

console.log(
  'AZ RETE zero-link-count NIL-goal retraction semantics: OK',
)
