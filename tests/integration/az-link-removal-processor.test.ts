import assert from 'node:assert/strict'

import {
  AZDefaultLinkRemovalProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import {
  AZDefaultGoalStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import {
  AZDefaultIdentifierLinkStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultImpasseStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()

const states =
  new AZDefaultIdentifierLinkStateRegistry()

const goals =
  new AZDefaultGoalStateRegistry()

const impasses =
  new AZDefaultImpasseStateRegistry()

const processor =
  new AZDefaultLinkRemovalProcessor(
    states,
    goals,
    impasses,
  )

// 1. Normal mode, same level:
// decrement + unknown-level buffering.
const sameFrom =
  symbols.makeIdentifier('A')

const sameTo =
  symbols.makeIdentifier('B')

states.register(sameFrom, {
  level: 2,
  promotionLevel: 2,
})

states.register(sameTo, {
  linkCount: 2,
  level: 2,
  promotionLevel: 2,
})

processor.post(sameFrom, sameTo)

assert.equal(
  states.get(sameTo).linkCount,
  1,
)

assert.deepEqual(
  processor.getUnknownLevelIdentifiers(),
  [sameTo],
)

// Duplicate buffering is suppressed.
processor.addUnknownLevelIdentifier(sameTo)

assert.deepEqual(
  processor.getUnknownLevelIdentifiers(),
  [sameTo],
)

// 2. Different levels:
// decrement only, no unknown-level buffering.
const differentFrom =
  symbols.makeIdentifier('C')

const differentTo =
  symbols.makeIdentifier('D')

states.register(differentFrom, {
  level: 3,
  promotionLevel: 3,
})

states.register(differentTo, {
  linkCount: 2,
  level: 1,
  promotionLevel: 1,
})

processor.post(
  differentFrom,
  differentTo,
)

assert.equal(
  states.get(differentTo).linkCount,
  1,
)

assert.equal(
  processor.getUnknownLevelIdentifiers()
    .includes(differentTo),
  false,
)

// 3. JUST_UPDATE_COUNT:
// only linkCount changes.
const countFrom =
  symbols.makeIdentifier('E')

const countTo =
  symbols.makeIdentifier('F')

states.register(countFrom, {
  level: 1,
  promotionLevel: 1,
})

states.register(countTo, {
  linkCount: 2,
  level: 1,
  promotionLevel: 1,
})

processor.setLinkUpdateMode(
  'JUST_UPDATE_COUNT',
)

processor.post(countFrom, countTo)

assert.equal(
  states.get(countTo).linkCount,
  1,
)

assert.equal(
  processor.getUnknownLevelIdentifiers()
    .includes(countTo),
  false,
)

// 4. UPDATE_DISCONNECTED_IDS_LIST:
// when count reaches zero, remove from unknown
// and add once to disconnected.
const disconnected =
  symbols.makeIdentifier('G')

states.register(disconnected, {
  linkCount: 1,
  level: 1,
  promotionLevel: 1,
})

processor.addUnknownLevelIdentifier(
  disconnected,
)

processor.setLinkUpdateMode(
  'UPDATE_DISCONNECTED_IDS_LIST',
)

processor.post(null, disconnected)

assert.equal(
  states.get(disconnected).linkCount,
  0,
)

assert.equal(
  processor.getUnknownLevelIdentifiers()
    .includes(disconnected),
  false,
)

assert.deepEqual(
  processor.getDisconnectedIdentifiers(),
  [disconnected],
)

// Duplicate disconnected entries are suppressed.
processor.moveUnknownLevelIdentifierToDisconnected(
  disconnected,
)

assert.deepEqual(
  processor.getDisconnectedIdentifiers(),
  [disconnected],
)

// 5. Explicit unknown -> disconnected movement.
const movable =
  symbols.makeIdentifier('H')

states.register(movable, {
  level: 1,
  promotionLevel: 1,
})

processor.addUnknownLevelIdentifier(
  movable,
)

processor.moveUnknownLevelIdentifierToDisconnected(
  movable,
)

assert.equal(
  processor.getUnknownLevelIdentifiers()
    .includes(movable),
  false,
)

assert.equal(
  processor.getDisconnectedIdentifiers()
    .includes(movable),
  true,
)

// 6. Ordinary link removal to a goal is ignored.
processor.setLinkUpdateMode(
  'UPDATE_LINKS_NORMALLY',
)

const goalSource =
  symbols.makeIdentifier('I')

const goal =
  symbols.makeIdentifier('G')

states.register(goalSource, {
  level: 1,
  promotionLevel: 1,
})

states.register(goal, {
  linkCount: 1,
  level: 1,
  promotionLevel: 1,
})

goals.registerGoal(goal, 1)

processor.post(goalSource, goal)

assert.equal(
  states.get(goal).linkCount,
  1,
)

// Special ownership removal remains valid.
processor.post(null, goal)

assert.equal(
  states.get(goal).linkCount,
  0,
)

// 7. Ordinary link removal to an impasse is ignored.
const impasseSource =
  symbols.makeIdentifier('J')

const impasse =
  symbols.makeIdentifier('I')

states.register(impasseSource, {
  level: 1,
  promotionLevel: 1,
})

states.register(impasse, {
  linkCount: 1,
  level: 1,
  promotionLevel: 1,
})

impasses.registerImpasse(impasse)

processor.post(
  impasseSource,
  impasse,
)

assert.equal(
  states.get(impasse).linkCount,
  1,
)

// Special ownership removal remains valid.
processor.post(null, impasse)

assert.equal(
  states.get(impasse).linkCount,
  0,
)

// 8. Queue extraction.
const unknownBeforeTake =
  processor.getUnknownLevelIdentifiers().length

if (unknownBeforeTake > 0) {
  const next =
    processor.takeNextUnknownLevelIdentifier()

  assert.notEqual(next, null)
}

const disconnectedBeforeTake =
  processor.getDisconnectedIdentifiers().length

if (disconnectedBeforeTake > 0) {
  const next =
    processor.takeNextDisconnectedIdentifier()

  assert.notEqual(next, null)
}

// Queue terminal/removal semantics.
const absent =
  symbols.makeIdentifier('Z')

assert.equal(
  processor.removeUnknownLevelIdentifier(absent),
  false,
)

while (
  processor.takeNextUnknownLevelIdentifier() !== null
) {}

assert.equal(
  processor.takeNextUnknownLevelIdentifier(),
  null,
)

while (
  processor.takeNextDisconnectedIdentifier() !== null
) {}

assert.equal(
  processor.takeNextDisconnectedIdentifier(),
  null,
)
console.log(
  'AZ autonomous link-removal processing: OK',
)

