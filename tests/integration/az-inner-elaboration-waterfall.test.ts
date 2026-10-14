import assert from 'node:assert/strict'

import { AZInnerElaborationWaterfallEngine } from '../../src/engines/cognitive/az/core/cycle/AZInnerElaborationWaterfallEngine'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZNewPreferenceAsserter } from '../../src/engines/cognitive/az/core/production/AZNewPreferenceAsserter'
import { AZInstantiationFiringEngine } from '../../src/engines/cognitive/az/core/production/AZInstantiationFiringEngine'
import { AZInstantiationRetractor } from '../../src/engines/cognitive/az/core/production/AZInstantiationRetractor'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import { DefaultActiveGoalResolver } from '../../src/engines/cognitive/az/core/state/DefaultActiveGoalResolver'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbols = new AZSymbolManager()
const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()
const preferenceMemory =
  new AZPreferenceMemory()
const stack = new AZStateStack()

const topGoal = symbols.makeIdentifier('S')
const lowerGoal = symbols.makeIdentifier('S')

identifierStates.register(topGoal, {
  level: 1,
  promotionLevel: 1,
})

identifierStates.register(lowerGoal, {
  level: 2,
  promotionLevel: 2,
})

const top = stack.setTop({}, topGoal)
const lower =
  stack.appendLower(top, {}, lowerGoal)

const attribute =
  symbols.makeStringConstant('result')
const topValue =
  symbols.makeStringConstant('top-fired')
const lowerValue =
  symbols.makeStringConstant('lower-fired')

function makeProduction(
  name: string,
  goal: AZSymbol,
  value: AZSymbol,
): {
  production: AZProduction
  node: AZProductionNode
  assertionToken: AZToken
} {
  const production: AZProduction = {
    name,
    declaredSupport: 'I_SUPPORT',
    conditions: [],
    actions: [
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: goal,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: attribute,
        },
        value: {
          type: 'SYMBOL',
          symbol: value,
        },
        support: 'I_SUPPORT',
      },
    ],
    instantiations: [],
    productionNode: null,
  }

  const node = {
    type: 'PRODUCTION',
    production,
    parent: null,
    children: [],
    tokens: [],
  } as unknown as AZProductionNode

  production.productionNode = node

  const parentToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: null,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const assertionToken: AZToken = {
    parent: parentToken,
    workingMemoryElement: null,
    node,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  return {
    production,
    node,
    assertionToken,
  }
}

function makeEmptyProduction(
  name: string,
): {
  production: AZProduction
  node: AZProductionNode
} {
  const production: AZProduction = {
    name,
    declaredSupport: 'I_SUPPORT',
    conditions: [],
    actions: [],
    instantiations: [],
    productionNode: null,
  }

  const node = {
    type: 'PRODUCTION',
    production,
    parent: null,
    children: [],
    tokens: [],
  } as unknown as AZProductionNode

  production.productionNode = node

  return { production, node }
}

function makeInstantiation(
  id: number,
  production: AZProduction,
  goal: AZSymbol,
  level: number,
): AZInstantiation {
  const instantiation: AZInstantiation = {
    id,
    production,
    instantiatedConditions: [],
    matchGoal: goal,
    matchGoalLevel: level,
    inMatchSet: true,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }

  production.instantiations.push(
    instantiation,
  )

  return instantiation
}

const topRuntime =
  makeProduction(
    'az-waterfall-top',
    topGoal,
    topValue,
  )

const lowerRuntime =
  makeProduction(
    'az-waterfall-lower',
    lowerGoal,
    lowerValue,
  )

const matchSet = new AZMatchSet()

matchSet.addAssertion({
  type: 'I_ASSERTION',
  production: topRuntime.production,
  token: topRuntime.assertionToken,
  wme: null,
  matchGoal: topGoal,
  matchGoalLevel: 1,
})

matchSet.addAssertion({
  type: 'I_ASSERTION',
  production: lowerRuntime.production,
  token: lowerRuntime.assertionToken,
  wme: null,
  matchGoal: lowerGoal,
  matchGoalLevel: 2,
})

const oldRuntime =
  makeEmptyProduction('az-waterfall-old')

const oldInstantiation =
  makeInstantiation(
    900,
    oldRuntime.production,
    topGoal,
    1,
  )

const oldPreference = {
  type: 'ACCEPTABLE' as const,
  identifier: topGoal,
  attribute,
  value:
    symbols.makeStringConstant('old-value'),
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation: oldInstantiation,
}

oldInstantiation.generatedPreferences.push(
  oldPreference,
)

preferenceMemory.add(oldPreference)

matchSet.addRetraction({
  instantiation: oldInstantiation,
  productionNode: oldRuntime.node,
})

const nilRuntime =
  makeEmptyProduction('az-waterfall-nil')

const nilInstantiation =
  makeInstantiation(
    901,
    nilRuntime.production,
    lowerGoal,
    2,
  )

const nilPreference = {
  type: 'ACCEPTABLE' as const,
  identifier: lowerGoal,
  attribute,
  value:
    symbols.makeStringConstant(
      'nil-old-value',
    ),
  referent: null,
  level: 2,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation: nilInstantiation,
}

nilInstantiation.generatedPreferences.push(
  nilPreference,
)

preferenceMemory.add(nilPreference)

matchSet.addNilGoalRetraction({
  instantiation: nilInstantiation,
  productionNode: nilRuntime.node,
})

const assertionOrder: AZSymbol[] = []

class OrderedPreferenceAsserter extends AZNewPreferenceAsserter {
  public override assert(
    instantiations: readonly AZInstantiation[],
  ) {
    for (const instantiation of instantiations) {
      if (instantiation.matchGoal !== null) {
        assertionOrder.push(instantiation.matchGoal)
      }
    }

    return super.assert(instantiations)
  }
}
const engine =
  new AZInnerElaborationWaterfallEngine(
    new AZInstantiationFiringEngine(
      symbols,
      identifierStates,
    ),
    new OrderedPreferenceAsserter(
      preferenceMemory,
    ),
    new DefaultActiveGoalResolver(),
    new AZInstantiationRetractor(
      preferenceMemory,
    ),
    identifierStates,
  )

const result =
  engine.execute(
    matchSet,
    top,
    1,
    'PROPOSE',
    'IE_PRODS',
  )

assert.equal(
  result.createdInstantiations.length,
  2,
)

assert.equal(result.innerCycleCount, 2)
assert.deepEqual(assertionOrder, [topGoal, lowerGoal], 'waterfall must assert preferences level-by-level from higher to lower goal')
assert.equal(result.highestActiveGoal, top)
assert.equal(result.highestActiveLevel, 1)
assert.equal(result.nextChangeLevel, 2)

assert.equal(
  topRuntime.production
    .instantiations.length,
  1,
)

assert.equal(
  lowerRuntime.production
    .instantiations.length,
  1,
)

const topSlot =
  preferenceMemory.getSlot(
    topGoal,
    attribute,
  )

const lowerSlot =
  preferenceMemory.getSlot(
    lowerGoal,
    attribute,
  )

assert.equal(
  topSlot?.allPreferences.some(
    preference =>
      preference.value === topValue,
  ),
  true,
)

assert.equal(
  lowerSlot?.allPreferences.some(
    preference =>
      preference.value === lowerValue,
  ),
  true,
)

assert.equal(
  result.retractedInstantiations.length,
  2,
)

assert.equal(
  result.retractedInstantiations[0],
  oldInstantiation,
)

assert.equal(
  result.retractedInstantiations[1],
  nilInstantiation,
)

assert.equal(
  oldInstantiation.inMatchSet,
  false,
)

assert.equal(
  nilInstantiation.inMatchSet,
  false,
)

assert.equal(
  oldRuntime.production
    .instantiations.length,
  0,
)

assert.equal(
  nilRuntime.production
    .instantiations.length,
  0,
)

assert.equal(
  oldPreference.inTemporaryMemory,
  false,
)

assert.equal(
  nilPreference.inTemporaryMemory,
  false,
)

assert.equal(
  matchSet.hasPendingChanges(),
  false,
)

assert.equal(
  top.lower,
  lower,
  'waterfall traversal must not mutate the state stack',
)

/*
 * A nil-goal retraction must also work
 * when there is no active goal.
 */
const isolatedRuntime =
  makeEmptyProduction(
    'az-waterfall-null-goal',
  )

const isolatedInstantiation =
  makeInstantiation(
    902,
    isolatedRuntime.production,
    lowerGoal,
    2,
  )

matchSet.addNilGoalRetraction({
  instantiation: isolatedInstantiation,
  productionNode: isolatedRuntime.node,
})

const nilResult =
  engine.execute(
    matchSet,
    null,
    0,
    'APPLY',
    'IE_PRODS',
  )

assert.equal(
  nilResult.retractedInstantiations.length,
  1,
)

assert.equal(
  nilResult.retractedInstantiations[0],
  isolatedInstantiation,
)

assert.equal(
  isolatedInstantiation.inMatchSet,
  false,
)

assert.equal(
  matchSet.hasPendingChanges(),
  false,
)

/*
 * PROPOSE accepts only IE productions.
 */
assert.throws(
  () =>
    engine.execute(
      new AZMatchSet(),
      top,
      1,
      'PROPOSE',
      'PE_PRODS',
    ),
  /PROPOSE phase requires IE_PRODS/,
)

console.log(
  'AZ inner elaboration waterfall: OK',
)
