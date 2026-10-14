import assert from 'node:assert/strict'

import {
  AZElaborationConvergenceRunner,
  type AZElaborationCyclePort,
} from '../../src/engines/cognitive/az/core/cycle/AZElaborationConvergenceRunner'
import { AZElaborationActivityResolver } from '../../src/engines/cognitive/az/core/cycle/AZElaborationActivityResolver'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { DefaultActiveGoalResolver } from '../../src/engines/cognitive/az/core/state/DefaultActiveGoalResolver'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbols = new AZSymbolManager()
const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()
const stack = new AZStateStack()
const matchSet = new AZMatchSet()

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

function makeAssertion(
  name: string,
  goal: AZSymbol,
  level: number,
) {
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

  return {
    type: 'I_ASSERTION' as const,
    production,
    token,
    wme: null,
    matchGoal: goal,
    matchGoalLevel: level,
  }
}

const lowerAssertion =
  makeAssertion(
    'az-lower-active',
    lowerGoal,
    2,
  )

const topAssertion =
  makeAssertion(
    'az-top-active',
    topGoal,
    1,
  )

/*
 * Initial reachable state:
 * only the lower goal has activity.
 *
 * The real activity resolver must therefore
 * select level 2 while traversing top -> lower.
 */
matchSet.addAssertion(lowerAssertion)

const activityResolver =
  new AZElaborationActivityResolver(
    new DefaultActiveGoalResolver(),
    identifierStates,
  )

const initialActivity =
  activityResolver.resolve(
    'PROPOSE',
    stack.top,
    matchSet,
  )

assert.equal(initialActivity.status, 'ACTIVE')

if (initialActivity.status !== 'ACTIVE') {
  throw new Error(
    'Expected initial lower-goal activity',
  )
}

assert.equal(initialActivity.activeGoal, lower)
assert.equal(initialActivity.activeLevel, 2)

let consistencyCalls = 0
const events: string[] = []

const cycle: AZElaborationCyclePort = {
  execute: (
    activeMatchSet,
    activeGoal,
    activeLevel,
    phase,
    firingType,
  ) => {
    events.push(`fire:${activeLevel}`)

    assert.equal(phase, 'PROPOSE')
    assert.equal(firingType, 'IE_PRODS')

    if (activeLevel === 2) {
      assert.equal(activeGoal, lower)

      /*
       * Model the observable match-set transition
       * produced by an elaboration:
       * lower activity is consumed and higher-goal
       * activity becomes available.
       *
       * Goal selection itself remains entirely real.
       */
      const postponed =
        activeMatchSet.postponeNextAssertion(
          'I_ASSERTION',
          lowerGoal,
        )

      assert.notEqual(postponed, null)

      const consumed =
        activeMatchSet
          .consumeLastPostponedAssertion()

      assert.equal(consumed, postponed)

      activeMatchSet.addAssertion(
        topAssertion,
      )
    } else {
      assert.equal(activeGoal, top)
      assert.equal(activeLevel, 1)

      const postponed =
        activeMatchSet.postponeNextAssertion(
          'I_ASSERTION',
          topGoal,
        )

      assert.notEqual(postponed, null)

      activeMatchSet
        .consumeLastPostponedAssertion()
    }

    return {
      waterfall: {
        createdInstantiations: [],
        retractedInstantiations: [],
        innerCycleCount: 1,
        highestActiveGoal: activeGoal,
        highestActiveLevel: activeLevel,
        nextChangeLevel: activeLevel,
      },
    }
  },
}

const runner =
  new AZElaborationConvergenceRunner(
    activityResolver,
    cycle,
    matchSet,
    stack,
    {
      process: () => {
        consistencyCalls += 1
        events.push('consistency')
        return false
      },
    },
  )

const first =
  runner.executeStep('PROPOSE')

assert.equal(first.executed, true)
assert.equal(first.continuePhase, true)
assert.deepEqual(events, ['fire:2'])

const afterFirst =
  activityResolver.resolve(
    'PROPOSE',
    stack.top,
    matchSet,
  )

assert.equal(afterFirst.status, 'ACTIVE')

if (afterFirst.status !== 'ACTIVE') {
  throw new Error(
    'Expected higher-goal activity after lower firing',
  )
}

assert.equal(afterFirst.activeGoal, top)
assert.equal(afterFirst.activeLevel, 1)

/*
 * AZ HIGHER_LEVEL invariant:
 * when activity moves from level 2 to level 1,
 * consistency at the newly active higher level
 * must run before any production fires there.
 */
const second =
  runner.executeStep('PROPOSE')

assert.equal(second.executed, true)

assert.deepEqual(
  events,
  ['fire:2', 'consistency', 'fire:1', 'consistency'],
)

assert.equal(consistencyCalls, 2)

console.log(
  'AZ higher-level transition consistency barrier: OK',
)
