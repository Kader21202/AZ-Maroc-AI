import { strict as assert } from 'node:assert'

import { DefaultActiveGoalResolver } from '../../src/engines/cognitive/az/core/state/DefaultActiveGoalResolver'

interface MinimalGoal {
  readonly id: string
}

interface MinimalContext {
  readonly goal: MinimalGoal
  higher: MinimalContext | null
  lower: MinimalContext | null
}

const topGoal = { id: 'G1' }
const middleGoal = { id: 'G2' }
const bottomGoal = { id: 'G3' }

const top: MinimalContext = {
  goal: topGoal,
  higher: null,
  lower: null,
}

const middle: MinimalContext = {
  goal: middleGoal,
  higher: top,
  lower: null,
}

const bottom: MinimalContext = {
  goal: bottomGoal,
  higher: middle,
  lower: null,
}

top.lower = middle
middle.lower = bottom

const resolver = new DefaultActiveGoalResolver()

function matchSet(
  assertionType: 'I_ASSERTION' | 'O_ASSERTION' | null,
  assertionGoal: MinimalGoal | null,
  retractionGoal: MinimalGoal | null = null,
) {
  return {
    hasAssertion: (
      type: 'I_ASSERTION' | 'O_ASSERTION',
      goal: MinimalGoal,
    ): boolean =>
      type === assertionType &&
      goal === assertionGoal,

    hasRetraction: (
      goal: MinimalGoal,
    ): boolean =>
      goal === retractionGoal,
  }
}

const oAtMiddle = matchSet(
  'O_ASSERTION',
  middleGoal,
)

assert.equal(
  resolver.resolve(top, 'PROPOSE', oAtMiddle, true),
  null,
)

assert.equal(
  resolver.resolve(top, 'APPLY', oAtMiddle, true),
  middle,
)

const iAtBottom = matchSet(
  'I_ASSERTION',
  bottomGoal,
)

assert.equal(
  resolver.resolve(top, 'PROPOSE', iAtBottom, true),
  bottom,
)

assert.equal(
  resolver.resolve(top, 'APPLY', iAtBottom, true),
  bottom,
)

const retractionAtMiddle = matchSet(
  null,
  null,
  middleGoal,
)

assert.equal(
  resolver.resolve(top, 'PROPOSE', retractionAtMiddle, true),
  middle,
)

assert.equal(
  resolver.resolve(top, 'APPLY', retractionAtMiddle, true),
  middle,
)

const empty = matchSet(null, null)

assert.equal(
  resolver.resolve(top, 'PROPOSE', empty, true),
  null,
)

assert.throws(
  () =>
    resolver.resolve(
      top,
      'PROPOSE',
      empty,
      false,
    ),
  /Unable to find an active goal/,
)

console.log(
  'AZ active-goal resolver contracts: OK',
)
