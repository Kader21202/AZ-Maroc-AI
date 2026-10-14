import assert from 'node:assert/strict'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import type { AZGoalContext } from '../../src/engines/cognitive/az/core/state/AZGoalContext'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'

const makeGoal = (
  id: string,
  hashId: number,
): AZSymbol => ({
  id,
  hashId,
  type: 'IDENTIFIER',
  value: null,
})

const stack = new AZGoalContextStack()

const top =
  stack.setTop(makeGoal('goal-top', 1))

const foreignParent: AZGoalContext = {
  goal: makeGoal('goal-foreign', 2),
  higher: null,
  lower: null,
}

assert.throws(
  () =>
    stack.appendLower(
      foreignParent,
      makeGoal('goal-invalid-child', 3),
    ),
  /Parent goal context does not belong to this stack/,
)

stack.appendLower(
  top,
  makeGoal('goal-lower', 4),
)

assert.throws(
  () =>
    stack.appendLower(
      top,
      makeGoal('goal-second-lower', 5),
    ),
  /Parent goal context already has a lower context/,
)

console.log(
  'AZ core goal context stack invariants: OK',
)
