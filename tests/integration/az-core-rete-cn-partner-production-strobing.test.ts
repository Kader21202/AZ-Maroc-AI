import assert from 'node:assert/strict'

import { AZDefaultInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiatedConditionBuilder'
import { AZDefaultInstantiationRematchMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiationRematchMatcher'
import { AZDefaultProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZDefaultProductionNodeActivator'
import { AZDefaultReteActivationEngine } from '../../src/engines/cognitive/az/core/production/AZDefaultReteActivationEngine'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteHashReferentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashReferentResolver'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZCnNode } from '../../src/engines/cognitive/az/core/production/AZCnNode'
import type { AZCnToken } from '../../src/engines/cognitive/az/core/production/AZCnToken'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionAssertionTypeResolver } from '../../src/engines/cognitive/az/core/production/AZProductionAssertionTypeResolver'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZReteMatchGoalResolver } from '../../src/engines/cognitive/az/core/production/AZReteMatchGoalResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const goal = symbol('G')

const wme: AZWorkingMemoryElement = {
  timetag: 2001,
  identifier: goal,
  attribute: symbol('A'),
  value: symbol('V'),
  acceptable: false,
}

const production: AZProduction = {
  name: 'az-cn-partner-production-strobing',
  declaredSupport: 'O_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
}

const cnNode: AZCnNode = {
  type: 'CN',
  nodeId: 2002,
  parent: null,
  children: [],
  partner: null,
  tokens: [],
}

const partnerNode: AZCnNode = {
  type: 'CN_PARTNER',
  nodeId: 2003,
  parent: null,
  children: [],
  partner: cnNode,
  tokens: [],
}

cnNode.partner = partnerNode

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 2004,
  parent: cnNode,
  children: [],
  production,
  tokens: [],
}

cnNode.children.push(productionNode)

const rootToken: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const conditionBuilder =
  new AZDefaultInstantiatedConditionBuilder(
    new AZDefaultReteParentResolver(),
  )

const rematchMatcher =
  new AZDefaultInstantiationRematchMatcher(
    conditionBuilder,
  )

const matchGoalResolver:
  AZReteMatchGoalResolver = {
    resolve() {
      return {
        goal,
        level: 1,
      }
    },
  }

const assertionTypeResolver:
  AZProductionAssertionTypeResolver = {
    resolve() {
      return 'O_ASSERTION'
    },
  }

const productionActivator =
  new AZDefaultProductionNodeActivator(
    rematchMatcher,
    matchGoalResolver,
    assertionTypeResolver,
  )

const hashIndex =
  new AZDefaultReteHashIndex()

const identityManager =
  new AZDefaultReteTokenIdentityManager()

const linkManager =
  new AZDefaultReteLinkManager()

const remover =
  new AZDefaultReteTokenRemovalManager(
    hashIndex,
    identityManager,
    productionActivator,
    linkManager,
  )

const engine =
  new AZDefaultReteActivationEngine(
    new AZDefaultReteTestMatcher(),
    productionActivator,
    hashIndex,
    new AZDefaultReteHashReferentResolver(),
    remover,
    identityManager,
    linkManager,
  )

remover.setChildLeftActivator(engine)

const matchSet = new AZMatchSet()

/*
 * 1. Real CN activation creates an unblocked CN token and
 * propagates through the real activation engine to PRODUCTION.
 */
const cnToken =
  engine.activateCnLeft(
    cnNode,
    rootToken,
    wme,
    matchSet,
  ) as AZCnToken

assert.equal(
  cnNode.tokens.length,
  1,
  'Initial CN activation must create exactly one CN token',
)

assert.equal(
  productionNode.tokens.length,
  1,
  'Unblocked CN activation must propagate to PRODUCTION',
)

const originalProductionToken =
  productionNode.tokens[0]

assert.notEqual(
  originalProductionToken,
  undefined,
)

assert.equal(
  matchSet.hasAssertion(
    'O_ASSERTION',
    goal,
  ),
  true,
  'Initial production match must create a tentative assertion',
)

/*
 * Consume the assertion as if the production had fired.
 */
const postponed =
  matchSet.postponeNextAssertion(
    'O_ASSERTION',
    goal,
  )

assert.notEqual(postponed, null)

const consumed =
  matchSet.consumeLastPostponedAssertion()

assert.notEqual(consumed, null)

assert.equal(
  matchSet.hasPendingChanges(),
  false,
)

/*
 * Install the already-fired instantiation represented by
 * the production match.
 */
const instantiation: AZInstantiation = {
  id: 2005,
  production,
  instantiatedConditions: [],
  matchGoal: goal,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: cnToken,
  reteWme: null,
}

production.instantiations.push(
  instantiation,
)

/*
 * 2. Real CN_PARTNER activation creates the blocker.
 * The activation engine must remove the CN descendants through
 * the real token-removal manager.
 */
const blocker =
  engine.activateCnPartnerLeft(
    partnerNode,
    rootToken,
    wme,
    matchSet,
  )

assert.equal(
  cnToken.cnPartnerTokens.length,
  1,
  'CN_PARTNER activation must attach one blocker to the CN token',
)

assert.equal(
  cnToken.cnPartnerTokens[0],
  blocker,
)

assert.equal(
  productionNode.tokens.length,
  0,
  'Blocking the CN token must remove its production descendant',
)

assert.equal(
  instantiation.reteToken,
  null,
  'Blocking must clear the instantiated production reteToken',
)

assert.equal(
  instantiation.reteWme,
  null,
  'Blocking must clear the instantiated production reteWme',
)

assert.equal(
  matchSet.hasRetraction(goal),
  true,
  'Blocking an instantiated production match must create a tentative retraction',
)

/*
 * 3. Remove the last blocker through the real removal manager.
 *
 * This must trigger:
 * CN_PARTNER removal
 *   -> CN last-blocker transition 1 -> 0
 *   -> real child-left reactivation
 *   -> PRODUCTION activation
 *   -> cancellation of the tentative retraction
 *   -> restoration of the SAME instantiation.
 */
remover.removeTokenAndSubtree(
  blocker,
  matchSet,
)

assert.equal(
  cnToken.cnPartnerTokens.length,
  0,
  'Removing the last CN_PARTNER token must unblock the CN token',
)

assert.equal(
  partnerNode.tokens.length,
  0,
  'The removed CN_PARTNER token must leave its node',
)

assert.equal(
  productionNode.tokens.length,
  1,
  'Last-blocker removal must recreate the production match',
)

const rematchedProductionToken =
  productionNode.tokens[0]

assert.notEqual(
  rematchedProductionToken,
  originalProductionToken,
  'CN strobing must recreate the production RETE token',
)

assert.equal(
  production.instantiations.length,
  1,
  'CN strobing must preserve exactly one instantiation',
)

assert.equal(
  production.instantiations[0],
  instantiation,
  'CN strobing must preserve the original instantiation object',
)

assert.equal(
  instantiation.reteToken,
  cnToken,
  'CN reactivation must restore the original instantiation reteToken to the surviving CN token',
)

assert.equal(
  instantiation.reteWme,
  null,
  'CN reactivation must restore the production-edge WME identity',
)

assert.equal(
  matchSet.hasRetraction(goal),
  false,
  'CN reactivation must cancel the tentative retraction',
)

assert.equal(
  matchSet.hasPendingChanges(),
  false,
  'CN_PARTNER strobing in one elaboration cycle must leave no net match-set change',
)

assert.equal(
  cnToken.children.includes(
    originalProductionToken!,
  ),
  false,
  'The old production token must remain detached',
)

assert.equal(
  cnToken.children.includes(
    rematchedProductionToken!,
  ),
  true,
  'The rematched production token must be attached to the surviving CN token',
)

console.log(
  'AZ RETE CN_PARTNER production strobing: OK',
)
