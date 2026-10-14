import assert from 'node:assert/strict'

import { AZDefaultInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiatedConditionBuilder'
import { AZDefaultInstantiationRematchMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiationRematchMatcher'
import { AZDefaultProductionNodeActivator } from '../../src/engines/cognitive/az/core/production/AZDefaultProductionNodeActivator'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
import { AZDefaultReteTokenIdentityManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTokenRemovalManager'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionAssertionTypeResolver } from '../../src/engines/cognitive/az/core/production/AZProductionAssertionTypeResolver'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZReteMatchGoalResolver } from '../../src/engines/cognitive/az/core/production/AZReteMatchGoalResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (
  id: string,
): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const goal = symbol('S')

const attribute: AZSymbol = {
  id: 'A',
  hashId: 65,
  type: 'STRING_CONSTANT',
  value: 'value',
}

const value: AZSymbol = {
  id: 'V',
  hashId: 86,
  type: 'STRING_CONSTANT',
  value: 'v',
}

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: goal,
  attribute,
  value,
  acceptable: false,
}

const production: AZProduction = {
  name: 'az-production-strobing',
  declaredSupport: 'O_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
}

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 1001,
  parent: null,
  children: [],
  production,
  tokens: [],
}

const parentToken: AZToken = {
  parent: null,
  workingMemoryElement: wme,
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

const matchSet = new AZMatchSet()

/*
 * 1. The production match appears.
 */
const originalProductionToken =
  productionActivator.activate(
    productionNode,
    parentToken,
    wme,
    matchSet,
  )

assert.equal(
  matchSet.hasPendingChanges(),
  true,
  'Initial production match must create a tentative assertion',
)

/*
 * Simulate the assertion being consumed/fired.
 */
const postponed =
  matchSet.postponeNextAssertion(
    'O_ASSERTION',
    goal,
  )

assert.notEqual(
  postponed,
  null,
  'Initial assertion must be postponable',
)

const consumed =
  matchSet.consumeLastPostponedAssertion()

assert.notEqual(
  consumed,
  null,
  'Initial assertion must be consumable',
)

assert.equal(
  matchSet.hasPendingChanges(),
  false,
)

/*
 * The already-created AZ instantiation now owns
 * the RETE match represented by the production token.
 */
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

/*
 * 2. The match disappears.
 *
 * Real AZ token removal must detach the production token,
 * null the instantiation RETE references and create a
 * tentative retraction.
 */
remover.removeTokenAndSubtree(
  originalProductionToken,
  matchSet,
)

assert.equal(
  instantiation.reteToken,
  null,
  'Removing the production match must clear reteToken',
)

assert.equal(
  instantiation.reteWme,
  null,
  'Removing the production match must clear reteWme',
)

assert.equal(
  matchSet.hasRetraction(goal),
  true,
  'Removing an instantiated production match must create a tentative retraction',
)

assert.equal(
  matchSet.hasPendingChanges(),
  true,
)

/*
 * 3. Before the elaboration cycle commits the retraction,
 * the exact same RETE match appears again.
 *
 * A NEW production token object is created, but the old
 * instantiation must be rematched and restored.
 */
const rematchedProductionToken =
  productionActivator.activate(
    productionNode,
    parentToken,
    wme,
    matchSet,
  )

assert.notEqual(
  rematchedProductionToken,
  originalProductionToken,
  'Strobing reappearance must create a new RETE token object',
)

assert.equal(
  instantiation.reteToken,
  parentToken,
  'Successful rematch must restore the existing instantiation reteToken',
)

assert.equal(
  instantiation.reteWme,
  wme,
  'Successful rematch must restore the existing instantiation reteWme',
)

assert.equal(
  production.instantiations.length,
  1,
  'Strobing must preserve the original instantiation rather than create another one',
)

assert.equal(
  production.instantiations[0],
  instantiation,
  'The original instantiation must survive the strobe',
)

assert.equal(
  matchSet.hasRetraction(goal),
  false,
  'Reappearance of the same match must cancel the tentative retraction',
)

assert.equal(
  matchSet.hasPendingChanges(),
  false,
  'AZ strobing invariant: disappear-then-reappear in one cycle must leave no net match-set change',
)

assert.equal(
  productionNode.tokens.includes(
    originalProductionToken,
  ),
  false,
  'The removed production token must remain removed',
)

assert.equal(
  productionNode.tokens.includes(
    rematchedProductionToken,
  ),
  true,
  'The rematched production token must be installed',
)

assert.equal(
  parentToken.children.includes(
    rematchedProductionToken,
  ),
  true,
  'The new production token must be linked to its parent token',
)

console.log(
  'AZ RETE production strobing retraction-rematch: OK',
)

/*
 * Opposite strobe direction:
 *
 * A new match appears and creates a tentative assertion,
 * then disappears before that assertion is consumed/fired.
 *
 * AZ semantic invariant:
 * removing that exact production token must cancel the
 * tentative assertion rather than manufacture a retraction.
 */
{
  const transientProduction: AZProduction = {
    name: 'az-production-strobing-transient-assertion',
    declaredSupport: 'O_SUPPORT',
    conditions: [],
    actions: [],
    instantiations: [],
  }

  const transientProductionNode: AZProductionNode = {
    type: 'PRODUCTION',
    nodeId: 1002,
    parent: null,
    children: [],
    production: transientProduction,
    tokens: [],
  }

  const transientMatchSet = new AZMatchSet()

  const transientProductionToken =
    productionActivator.activate(
      transientProductionNode,
      parentToken,
      wme,
      transientMatchSet,
    )

  assert.equal(
    transientMatchSet.hasAssertion(
      'O_ASSERTION',
      goal,
    ),
    true,
    'A new production match must create a tentative assertion',
  )

  assert.equal(
    transientMatchSet.hasPendingChanges(),
    true,
  )

  remover.removeTokenAndSubtree(
    transientProductionToken,
    transientMatchSet,
  )

  assert.equal(
    transientMatchSet.hasAssertion(
      'O_ASSERTION',
      goal,
    ),
    false,
    'Removing an unconsumed match must cancel its tentative assertion',
  )

  assert.equal(
    transientMatchSet.hasRetraction(goal),
    false,
    'Cancelling a tentative assertion must not create a retraction',
  )

  assert.equal(
    transientMatchSet.hasPendingChanges(),
    false,
    'AZ strobing invariant: appear-then-disappear before firing must leave no net match-set change',
  )

  assert.equal(
    transientProduction.instantiations.length,
    0,
    'A transient unconsumed assertion must not create an instantiation',
  )

  assert.equal(
    transientProductionNode.tokens.includes(
      transientProductionToken,
    ),
    false,
    'The transient production token must be removed',
  )

  assert.equal(
    parentToken.children.includes(
      transientProductionToken,
    ),
    false,
    'The transient production token must be detached from its parent',
  )

  console.log(
    'AZ RETE production strobing assertion-cancellation: OK',
  )
}
