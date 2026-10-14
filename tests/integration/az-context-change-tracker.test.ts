import assert from 'node:assert/strict'

import { AZContextChangeTracker } from '../../src/engines/cognitive/az/core/state/AZContextChangeTracker'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const g1: AZSymbol = {
  type: 'IDENTIFIER',
  id: 'G1',
  hashId: 1,
  value: 'G1',
}

const g2: AZSymbol = {
  type: 'IDENTIFIER',
  id: 'G2',
  hashId: 2,
  value: 'G2',
}

const g3: AZSymbol = {
  type: 'IDENTIFIER',
  id: 'G3',
  hashId: 3,
  value: 'G3',
}

goalStateRegistry.registerGoal(g1, 1)
goalStateRegistry.registerGoal(g2, 2)
goalStateRegistry.registerGoal(g3, 3)

const tracker =
  new AZContextChangeTracker(
    goalStateRegistry,
  )

tracker.markGoalAsContextChanged(g3)

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  g3,
)

tracker.markGoalAsContextChanged(g2)

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  g2,
)

tracker.markGoalAsContextChanged(g3)

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  g2,
)

tracker.markGoalAsContextChanged(g1)

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  g1,
)

tracker.clear()

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  null,
)

console.log(
  'AZ context change tracker: OK',
)

