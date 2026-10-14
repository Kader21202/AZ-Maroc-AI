import assert from 'node:assert/strict'

import { AZContextSlotsDecider } from '../../src/engines/cognitive/az/core/decision/AZContextSlotsDecider'
import { AZDefaultContextSlotDecidability } from '../../src/engines/cognitive/az/core/decision/AZDefaultContextSlotDecidability'
import type { AZContextSlotDecider } from '../../src/engines/cognitive/az/core/decision/AZContextSlotDecider'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZContextChangeTracker } from '../../src/engines/cognitive/az/core/state/AZContextChangeTracker'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(symbols)

const goalRegistry =
  new AZDefaultGoalStateRegistry()

const tracker =
  new AZContextChangeTracker(
    goalRegistry,
  )

const preferenceMemory =
  new AZPreferenceMemory(
    null,
    null,
    tracker,
  )

const workingMemory =
  new AZWorkingMemory()

const matchSet =
  new AZMatchSet()

const stack =
  new AZGoalContextStack()

const goal =
  symbols.makeIdentifier('S')

goalRegistry.registerGoal(goal, 1)
stack.setTop(goal)

const slot =
  preferenceMemory.getOrCreateContextSlot(
    goal,
    predefinedSymbols.operator,
  )

slot.changed = true
tracker.markGoalAsContextChanged(goal)

let decideCount = 0

const contextSlotDecider = {
  decide(target: typeof slot): boolean {
    decideCount += 1

    assert.equal(
      target,
      slot,
      'expected root operator slot',
    )

    return true
  },

  decideWithResult(): boolean {
    throw new Error(
      'NO_CHANGE must not be used for a decidable slot',
    )
  },
} as unknown as AZContextSlotDecider

const decider =
  new AZContextSlotsDecider(
    stack,
    tracker,
    predefinedSymbols,
    new AZDefaultContextSlotDecidability(),
    contextSlotDecider,
  )

decider.decideAll(
  preferenceMemory,
  workingMemory,
  matchSet,
)

assert.equal(
  decideCount,
  1,
  'decidable context slot must be decided once',
)

assert.equal(
  slot.changed,
  false,
  'context decision must consume slot.changed',
)

assert.equal(
  tracker.highestGoalWhoseContextChanged,
  null,
  'context-change tracker must be cleared after decision',
)

console.log(
  'AZ context slots decider: decidable slot OK',
)

/*
 * Non-decidable upper goal must descend to lower goal.
 */
{
  const symbols2 =
    new AZSymbolManager()

  const predefined2 =
    new AZPredefinedSymbols(symbols2)

  const registry2 =
    new AZDefaultGoalStateRegistry()

  const tracker2 =
    new AZContextChangeTracker(
      registry2,
    )

  const memory2 =
    new AZPreferenceMemory(
      null,
      null,
      tracker2,
    )

  const wm2 =
    new AZWorkingMemory()

  const match2 =
    new AZMatchSet()

  const stack2 =
    new AZGoalContextStack()

  const g1 =
    symbols2.makeIdentifier('S')

  const g2 =
    symbols2.makeIdentifier('S')

  registry2.registerGoal(g1, 1)
  registry2.registerGoal(g2, 2)

  const top =
    stack2.setTop(g1)

  stack2.appendLower(
    top,
    g2,
  )

  const upperSlot =
    memory2.getOrCreateContextSlot(
      g1,
      predefined2.operator,
    )

  const lowerSlot =
    memory2.getOrCreateContextSlot(
      g2,
      predefined2.operator,
    )

  upperSlot.changed = true

  const existing =
    wm2.createElement(
      g1,
      predefined2.operator,
      symbols2.makeIdentifier('O'),
      false,
    )

  upperSlot.wmes.push(existing)

  lowerSlot.changed = true

  tracker2.markGoalAsContextChanged(g1)

  let upperDecideCount = 0
  let lowerDecideCount = 0
  let noChangeCount = 0

  const contextSlotDecider2 = {
    decide(target: typeof upperSlot): boolean {
      if (target === upperSlot) {
        upperDecideCount += 1
      }

      if (target === lowerSlot) {
        lowerDecideCount += 1
      }

      return true
    },

    decideWithResult(): boolean {
      noChangeCount += 1
      return true
    },
  } as unknown as AZContextSlotDecider

  const decider2 =
    new AZContextSlotsDecider(
      stack2,
      tracker2,
      predefined2,
      new AZDefaultContextSlotDecidability(),
      contextSlotDecider2,
    )

  decider2.decideAll(
    memory2,
    wm2,
    match2,
  )

  assert.equal(
    upperDecideCount,
    0,
    'non-decidable upper slot must not be decided',
  )

  assert.equal(
    lowerDecideCount,
    1,
    'decision must descend to lower goal',
  )

  assert.equal(
    noChangeCount,
    0,
    'upper non-decidable slot must not create NO_CHANGE',
  )

  assert.equal(
    tracker2.highestGoalWhoseContextChanged,
    null,
    'tracker must be cleared after traversal',
  )
}

console.log(
  'AZ context slots decider: lower-goal descent OK',
)

/*
 * Non-decidable last goal must resolve as NO_CHANGE.
 */
{
  const symbols3 =
    new AZSymbolManager()

  const predefined3 =
    new AZPredefinedSymbols(symbols3)

  const registry3 =
    new AZDefaultGoalStateRegistry()

  const tracker3 =
    new AZContextChangeTracker(
      registry3,
    )

  const memory3 =
    new AZPreferenceMemory(
      null,
      null,
      tracker3,
    )

  const wm3 =
    new AZWorkingMemory()

  const match3 =
    new AZMatchSet()

  const stack3 =
    new AZGoalContextStack()

  const goal3 =
    symbols3.makeIdentifier('S')

  registry3.registerGoal(goal3, 1)
  stack3.setTop(goal3)

  const slot3 =
    memory3.getOrCreateContextSlot(
      goal3,
      predefined3.operator,
    )

  slot3.changed = true

  const existing3 =
    wm3.createElement(
      goal3,
      predefined3.operator,
      symbols3.makeIdentifier('O'),
      false,
    )

  slot3.wmes.push(existing3)

  tracker3.markGoalAsContextChanged(
    goal3,
  )

  let normalDecideCount = 0
  let noChangeCount = 0

  const contextSlotDecider3 = {
    decide(): boolean {
      normalDecideCount += 1
      return true
    },

    decideWithResult(
      target: typeof slot3,
      _workingMemory: AZWorkingMemory,
      _matchSet: AZMatchSet,
      result: {
        impasseType: string
        candidates: readonly unknown[]
      },
    ): boolean {
      assert.equal(
        target,
        slot3,
      )

      assert.equal(
        result.impasseType,
        'NO_CHANGE',
        'last non-decidable slot must use NO_CHANGE',
      )

      assert.equal(
        result.candidates.length,
        0,
      )

      noChangeCount += 1
      return true
    },
  } as unknown as AZContextSlotDecider

  const decider3 =
    new AZContextSlotsDecider(
      stack3,
      tracker3,
      predefined3,
      new AZDefaultContextSlotDecidability(),
      contextSlotDecider3,
    )

  decider3.decideAll(
    memory3,
    wm3,
    match3,
  )

  assert.equal(
    normalDecideCount,
    0,
    'last non-decidable slot must not use normal decision',
  )

  assert.equal(
    noChangeCount,
    1,
    'last non-decidable slot must receive one NO_CHANGE decision',
  )

  assert.equal(
    slot3.changed,
    false,
    'NO_CHANGE decision must consume slot.changed',
  )

  assert.equal(
    tracker3.highestGoalWhoseContextChanged,
    null,
    'tracker must be cleared after NO_CHANGE decision',
  )
}

console.log(
  'AZ context slots decider: last-goal NO_CHANGE OK',
)

/*
 * Matching existing impasse:
 * a false decision result must continue to the lower goal.
 */
{
  const symbols4 =
    new AZSymbolManager()

  const predefined4 =
    new AZPredefinedSymbols(symbols4)

  const registry4 =
    new AZDefaultGoalStateRegistry()

  const tracker4 =
    new AZContextChangeTracker(
      registry4,
    )

  const memory4 =
    new AZPreferenceMemory(
      null,
      null,
      tracker4,
    )

  const wm4 =
    new AZWorkingMemory()

  const match4 =
    new AZMatchSet()

  const stack4 =
    new AZGoalContextStack()

  const g1 =
    symbols4.makeIdentifier('S')

  const g2 =
    symbols4.makeIdentifier('S')

  registry4.registerGoal(g1, 1)
  registry4.registerGoal(g2, 2)

  const top4 =
    stack4.setTop(g1)

  stack4.appendLower(
    top4,
    g2,
  )

  const upperSlot4 =
    memory4.getOrCreateContextSlot(
      g1,
      predefined4.operator,
    )

  const lowerSlot4 =
    memory4.getOrCreateContextSlot(
      g2,
      predefined4.operator,
    )

  upperSlot4.changed = true
  lowerSlot4.changed = true

  tracker4.markGoalAsContextChanged(
    g1,
  )

  const visited:
    Array<typeof upperSlot4> = []

  const contextSlotDecider4 = {
    decide(
      target: typeof upperSlot4,
    ): boolean {
      visited.push(target)

      if (target === upperSlot4) {
        /*
         * Equivalent to:
         * existing matching impasse updated,
         * no structural context change.
         */
        return false
      }

      if (target === lowerSlot4) {
        return true
      }

      throw new Error(
        'Unexpected context slot',
      )
    },

    decideWithResult(): boolean {
      throw new Error(
        'NO_CHANGE must not be used in this scenario',
      )
    },
  } as unknown as AZContextSlotDecider

  const decider4 =
    new AZContextSlotsDecider(
      stack4,
      tracker4,
      predefined4,
      new AZDefaultContextSlotDecidability(),
      contextSlotDecider4,
    )

  decider4.decideAll(
    memory4,
    wm4,
    match4,
  )

  assert.equal(
    visited.length,
    2,
    'false context decision must continue to lower goal',
  )

  assert.equal(
    visited[0],
    upperSlot4,
    'upper context slot must be decided first',
  )

  assert.equal(
    visited[1],
    lowerSlot4,
    'lower context slot must be decided after false result',
  )

  assert.equal(
    upperSlot4.changed,
    false,
    'upper context change must be consumed',
  )

  assert.equal(
    lowerSlot4.changed,
    false,
    'lower context change must be consumed after traversal',
  )

  assert.equal(
    tracker4.highestGoalWhoseContextChanged,
    null,
    'tracker must be cleared after complete traversal',
  )
}

console.log(
  'AZ context slots decider: false-result traversal OK',
)

/*
 * Context traversal must start at
 * highestGoalWhoseContextChanged.
 */
{
  const symbols5 =
    new AZSymbolManager()

  const predefined5 =
    new AZPredefinedSymbols(symbols5)

  const registry5 =
    new AZDefaultGoalStateRegistry()

  const tracker5 =
    new AZContextChangeTracker(
      registry5,
    )

  const memory5 =
    new AZPreferenceMemory(
      null,
      null,
      tracker5,
    )

  const wm5 =
    new AZWorkingMemory()

  const match5 =
    new AZMatchSet()

  const stack5 =
    new AZGoalContextStack()

  const g1 =
    symbols5.makeIdentifier('S')

  const g2 =
    symbols5.makeIdentifier('S')

  const g3 =
    symbols5.makeIdentifier('S')

  registry5.registerGoal(g1, 1)
  registry5.registerGoal(g2, 2)
  registry5.registerGoal(g3, 3)

  const c1 =
    stack5.setTop(g1)

  const c2 =
    stack5.appendLower(
      c1,
      g2,
    )

  stack5.appendLower(
    c2,
    g3,
  )

  const slot1 =
    memory5.getOrCreateContextSlot(
      g1,
      predefined5.operator,
    )

  const slot2 =
    memory5.getOrCreateContextSlot(
      g2,
      predefined5.operator,
    )

  const slot3 =
    memory5.getOrCreateContextSlot(
      g3,
      predefined5.operator,
    )

  slot1.changed = true
  slot2.changed = true
  slot3.changed = true

  tracker5.markGoalAsContextChanged(
    g2,
  )

  const visited5:
    Array<typeof slot1> = []

  const contextSlotDecider5 = {
    decide(
      target: typeof slot1,
    ): boolean {
      visited5.push(target)
      return true
    },

    decideWithResult(): boolean {
      throw new Error(
        'NO_CHANGE must not be used in this scenario',
      )
    },
  } as unknown as AZContextSlotDecider

  const decider5 =
    new AZContextSlotsDecider(
      stack5,
      tracker5,
      predefined5,
      new AZDefaultContextSlotDecidability(),
      contextSlotDecider5,
    )

  decider5.decideAll(
    memory5,
    wm5,
    match5,
  )

  assert.equal(
    visited5.length,
    1,
    'one context decision is expected',
  )

  assert.equal(
    visited5[0],
    slot2,
    'context traversal must start at highest changed goal',
  )

  assert.equal(
    slot1.changed,
    true,
    'higher untouched goal must not be consumed',
  )

  assert.equal(
    slot2.changed,
    false,
    'starting changed goal must be consumed',
  )

  assert.equal(
    tracker5.highestGoalWhoseContextChanged,
    null,
    'tracker must be cleared after context decision',
  )
}

console.log(
  'AZ context slots decider: highest-changed-goal start OK',
)
