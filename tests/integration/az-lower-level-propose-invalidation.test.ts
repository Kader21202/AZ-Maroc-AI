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
matchSet.addAssertion(topAssertion)

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

assert.equal(initialActivity.activeGoal, top)
assert.equal(initialActivity.activeLevel, 1)

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

    if (activeLevel === 1) {
      assert.equal(activeGoal, top)

      /*
       * Model the observable match-set transition
       * produced by an elaboration:
       * top activity is consumed and lower-goal
       * activity becomes available.
       *
       * Goal selection itself remains entirely real.
       */
      const postponed =
        activeMatchSet.postponeNextAssertion(
          'I_ASSERTION',
          topGoal,
        )

      assert.notEqual(postponed, null)

      const consumed =
        activeMatchSet
          .consumeLastPostponedAssertion()

      assert.equal(consumed, postponed)

      activeMatchSet.addAssertion(
        lowerAssertion,
      )
    } else {
      assert.equal(activeGoal, lower)
      assert.equal(activeLevel, 2)

      const postponed =
        activeMatchSet.postponeNextAssertion(
          'I_ASSERTION',
          lowerGoal,
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
      processThrough: () => {
        consistencyCalls += 1
        events.push('consistency')
        return true
      },
    },
  )

const first =
  runner.executeStep('PROPOSE')

assert.equal(first.executed, true)
assert.equal(first.continuePhase, true)
assert.deepEqual(events, ['fire:1'])

const afterFirst =
  activityResolver.resolve(
    'PROPOSE',
    stack.top,
    matchSet,
  )

assert.equal(afterFirst.status, 'ACTIVE')

if (afterFirst.status !== 'ACTIVE') {
  throw new Error(
    'Expected lower-goal activity after top firing',
  )
}

assert.equal(afterFirst.activeGoal, lower)
assert.equal(afterFirst.activeLevel, 2)

/*
 * AZ PROPOSE LOWER_LEVEL invariant:
 * activity moves from level 1 to level 2;
 * consistency must run before firing at level 2.
 */
const second =
  runner.executeStep('PROPOSE')

assert.equal(second.executed, false)
assert.equal(second.continuePhase, false)
assert.equal(second.elaboration, null)

assert.deepEqual(
  events,
  ['fire:1', 'consistency'],
)

assert.equal(consistencyCalls, 1)

console.log(
  'AZ lower-level PROPOSE invalidation exits to DECIDE: OK',
)
