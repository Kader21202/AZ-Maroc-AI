import assert from 'node:assert/strict'
import type { AZGoalStateResolver } from '../../src/engines/cognitive/az/core/production/AZGoalStateResolver'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const goal: AZSymbol = {
  id: 'goal-compatibility',
  hashId: 1,
  type: 'IDENTIFIER',
  value: null,
}

const registry =
  new AZDefaultGoalStateRegistry()

const resolver: AZGoalStateResolver = registry

registry.registerGoal(goal, 2)

assert.equal(resolver.isGoal(goal), true)
assert.equal(resolver.getLevel(goal), 2)

console.log(
  'AZ core goal state resolver compatibility: OK',
)
