import assert from 'node:assert/strict'
import type { AZGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStateRegistry'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const goal: AZSymbol = {
  id: 'goal-1',
  hashId: 1,
  type: 'IDENTIFIER',
  value: null,
}

const other: AZSymbol = {
  id: 'other-1',
  hashId: 2,
  type: 'IDENTIFIER',
  value: null,
}

const registry: AZGoalStateRegistry =
  new AZDefaultGoalStateRegistry()

assert.equal(registry.isGoal(goal), false)
assert.equal(registry.isGoal(other), false)

assert.throws(
  () => registry.getLevel(goal),
  /Goal state is not registered/,
)

registry.registerGoal(goal, 1)

assert.equal(registry.isGoal(goal), true)
assert.equal(registry.getLevel(goal), 1)
assert.equal(registry.isGoal(other), false)

registry.registerGoal(goal, 3)

assert.equal(registry.getLevel(goal), 3)

registry.removeGoal(goal)

assert.equal(registry.isGoal(goal), false)

assert.throws(
  () => registry.getLevel(goal),
  /Goal state is not registered/,
)

console.log('AZ core goal state registry: OK')
