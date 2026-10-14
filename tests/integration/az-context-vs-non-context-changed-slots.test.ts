import assert from 'node:assert/strict'

import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZContextChangeTracker } from '../../src/engines/cognitive/az/core/state/AZContextChangeTracker'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const predefined =
  new AZPredefinedSymbols(symbols)

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const goal =
  symbols.makeIdentifier('S')

const lowerGoal =
  symbols.makeIdentifier('S')

goalStateRegistry.registerGoal(goal, 1)
goalStateRegistry.registerGoal(lowerGoal, 2)

const tracker =
  new AZContextChangeTracker(
    goalStateRegistry,
  )

const memory =
  new AZPreferenceMemory(
    null,
    null,
    tracker,
  )

const contextSlot =
  memory.getOrCreateContextSlot(
    goal,
    predefined.operator,
  )

memory.markSlotAsChanged(contextSlot)

assert.equal(
  contextSlot.changed,
  true,
)

assert.equal(
  memory.takeNextChangedSlot(),
  null,
  'context slots must not enter the non-context changed-slot queue',
)

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  goal,
)

const lowerContextSlot =
  memory.getOrCreateContextSlot(
    lowerGoal,
    predefined.operator,
  )

memory.markSlotAsChanged(
  lowerContextSlot,
)

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  goal,
  'the highest changed context goal must be retained',
)

assert.equal(
  memory.takeNextChangedSlot(),
  null,
  'lower context slots must also stay outside the non-context queue',
)

tracker.clear()

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  null,
)

const normalAttribute =
  symbols.makeStringConstant('result')

const normalSlot =
  memory.getOrCreateContextSlot(
    goal,
    normalAttribute,
  )

normalSlot.isaContextSlot = false

memory.markSlotAsChanged(
  normalSlot,
)

assert.equal(
  normalSlot.changed,
  true,
)

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  null,
  'non-context changes must not affect context-change tracking',
)

assert.equal(
  memory.takeNextChangedSlot(),
  normalSlot,
  'non-context changed slots must enter the changed-slot queue',
)

assert.equal(
  memory.takeNextChangedSlot(),
  null,
)

console.log(
  'AZ context/non-context changed-slot separation: OK',
)
