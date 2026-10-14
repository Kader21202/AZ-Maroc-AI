import assert from 'node:assert/strict'

import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZDefaultReteMatchGoalResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteMatchGoalResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'

const symbol = (
  id: string,
  type: AZSymbol['type'] = 'IDENTIFIER',
): AZSymbol => ({
  id,
  hashId: 1,
  type,
  value: id,
})

const attribute = symbol('attribute')
const value = symbol('value')

const makeWme = (
  timetag: number,
  identifier: AZSymbol,
): AZWorkingMemoryElement => ({
  timetag,
  identifier,
  attribute,
  value,
  acceptable: false,
})

const makeToken = (
  wme: AZWorkingMemoryElement | null,
  parent: AZToken | null,
): AZToken => ({
  parent,
  workingMemoryElement: wme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
})

const topGoal = symbol('S1')
const lowerGoal = symbol('S2')
const ordinaryIdentifier = symbol('I1')

const activeGoalRegistry =
  new AZDefaultGoalStateRegistry()

const goalIdentityRegistry =
  new AZDefaultGoalIdentityRegistry()

for (const [goal, level] of [
  [topGoal, 1],
  [lowerGoal, 2],
] as const) {
  activeGoalRegistry.registerGoal(goal, level)
  goalIdentityRegistry.registerGoal(goal, level)
}
const resolver =
  new AZDefaultReteMatchGoalResolver(
    goalIdentityRegistry,
  )

const topToken =
  makeToken(makeWme(1, topGoal), null)

const ordinaryToken =
  makeToken(
    makeWme(2, ordinaryIdentifier),
    topToken,
  )

const result = resolver.resolve(
  ordinaryToken,
  makeWme(3, lowerGoal),
)

assert.equal(result.goal, lowerGoal)
assert.equal(result.level, 2)

const lowerToken =
  makeToken(
    makeWme(4, lowerGoal),
    topToken,
  )

const chainResult =
  resolver.resolve(
    lowerToken,
    makeWme(5, ordinaryIdentifier),
  )

assert.equal(chainResult.goal, lowerGoal)
assert.equal(chainResult.level, 2)

assert.throws(
  () => resolver.resolve(
    makeToken(
      makeWme(6, ordinaryIdentifier),
      null,
    ),
    null,
  ),
  /Cannot find goal for RETE match assertion/,
)

const historicalGoal = symbol('S4')
activeGoalRegistry.registerGoal(historicalGoal, 4)
goalIdentityRegistry.registerGoal(historicalGoal, 4)

const historicalGoalToken =
  makeToken(
    makeWme(7, historicalGoal),
    null,
  )

const beforeRemoval =
  resolver.resolve(
    historicalGoalToken,
    null,
  )

assert.equal(beforeRemoval.goal, historicalGoal)
assert.equal(beforeRemoval.level, 4)

/*
 * AZ invariant:
 * active-context removal must not erase historical
 * goal identity + level while RETE still refers to it.
 */
activeGoalRegistry.removeGoal(historicalGoal)

assert.equal(activeGoalRegistry.isGoal(historicalGoal), false)
assert.equal(goalIdentityRegistry.isGoal(historicalGoal), true)
assert.equal(goalIdentityRegistry.getLevel(historicalGoal), 4)

const afterActiveGoalRemoval =
  resolver.resolve(
    historicalGoalToken,
    null,
  )

assert.equal(
  afterActiveGoalRemoval.goal,
  historicalGoal,
)
assert.equal(afterActiveGoalRemoval.level, 4)
console.log(
  'AZ core RETE match goal resolution: OK',
)
