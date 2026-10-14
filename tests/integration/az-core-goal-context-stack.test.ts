import assert from 'node:assert/strict'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
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

const topGoal = makeGoal('goal-top', 1)
const lowerGoal = makeGoal('goal-lower', 2)
const deepestGoal = makeGoal('goal-deepest', 3)

const stack = new AZGoalContextStack()

assert.equal(stack.top, null)
assert.equal(stack.bottom, null)

const top =
  stack.setTop(topGoal)

assert.equal(stack.top, top)
assert.equal(stack.bottom, top)
assert.equal(top.goal, topGoal)
assert.equal(top.higher, null)
assert.equal(top.lower, null)

assert.throws(
  () => stack.setTop(makeGoal('second-top', 4)),
  /Top goal context already exists/,
)

const lower =
  stack.appendLower(top, lowerGoal)

assert.equal(top.lower, lower)
assert.equal(lower.higher, top)
assert.equal(lower.goal, lowerGoal)
assert.equal(stack.bottom, lower)

const deepest =
  stack.appendLower(lower, deepestGoal)

assert.equal(lower.lower, deepest)
assert.equal(deepest.higher, lower)
assert.equal(stack.bottom, deepest)

assert.equal(
  stack.findByGoal(lowerGoal),
  lower,
)

assert.equal(
  stack.findByGoal(makeGoal('unknown', 99)),
  null,
)

assert.equal(
  stack.truncateFrom(lowerGoal),
  true,
)

assert.equal(stack.top, top)
assert.equal(stack.bottom, top)
assert.equal(top.lower, null)

assert.equal(
  stack.findByGoal(lowerGoal),
  null,
)

assert.equal(
  stack.truncateFrom(lowerGoal),
  false,
)

assert.equal(
  stack.truncateFrom(topGoal),
  true,
)

assert.equal(stack.top, null)
assert.equal(stack.bottom, null)

console.log('AZ core goal context stack: OK')
