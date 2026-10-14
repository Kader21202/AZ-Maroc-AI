import assert from 'node:assert/strict'

import {
  AZDefaultLinkAdditionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import {
  AZDefaultLinkRemovalProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import {
  AZPreferenceMemory,
} from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import type {
  AZPreference,
} from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type {
  AZInstantiation,
} from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import {
  AZDefaultGoalStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import {
  AZDefaultIdentifierLinkStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultImpasseStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import {
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const linkStates =
  new AZDefaultIdentifierLinkStateRegistry()

const goals =
  new AZDefaultGoalStateRegistry()

const impasses =
  new AZDefaultImpasseStateRegistry()

const additions =
  new AZDefaultLinkAdditionProcessor(
    linkStates,
    goals,
    impasses,
  )

const removals =
  new AZDefaultLinkRemovalProcessor(
    linkStates,
    goals,
    impasses,
  )

const memory =
  new AZPreferenceMemory(
    additions,
    removals,
  )

const source =
  symbols.makeIdentifier('S')

const valueLow =
  symbols.makeIdentifier('V')

const valueHigh =
  symbols.makeIdentifier('V')

const referent =
  symbols.makeIdentifier('R')

const attribute =
  symbols.makeStringConstant(
    'operator',
  )

for (
  const symbol of [
    source,
    valueLow,
    valueHigh,
    referent,
  ]
) {
  linkStates.register(symbol, {
    level: 1,
    promotionLevel: 1,
  })
}

function makeInstantiation(
  id: number,
  matchGoalLevel: number,
): AZInstantiation {
  return {
    id,
    production: null,
    instantiatedConditions: [],
    matchGoal: null,
    matchGoalLevel,
    inMatchSet: false,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }
}

const lowPreference:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: source,
    attribute,
    value: valueLow,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(1, 1),
  }

const highPreference:
  AZPreference = {
    type: 'BETTER',
    identifier: source,
    attribute,
    value: valueHigh,
    referent,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(2, 3),
  }

// First insertion creates the slot.
assert.equal(
  memory.add(lowPreference),
  true,
)

const slot =
  memory.getSlot(
    source,
    attribute,
  )

assert.notEqual(slot, null)

assert.equal(
  lowPreference.slot,
  slot,
)

assert.equal(
  lowPreference.inTemporaryMemory,
  true,
)
assert.equal(
  slot!.changed,
  true,
)

assert.deepEqual(
  memory.getSlotsForIdentifier(
    source,
  ),
  [slot],
)

// Identifier value creates a structural link.
assert.equal(
  linkStates.get(valueLow)
    .linkCount,
  1,
)

// A non-binary preference must ignore its referent
// for structural-link accounting.
const nonBinaryReferent =
  symbols.makeIdentifier('R')

linkStates.register(
  nonBinaryReferent,
  {
    level: 1,
    promotionLevel: 1,
  },
)

const nonBinaryWithReferent:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: source,
    attribute,
    value: valueLow,
    referent: nonBinaryReferent,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(10, 1),
  }

assert.equal(
  memory.add(nonBinaryWithReferent),
  true,
)

assert.equal(
  linkStates.get(valueLow).linkCount,
  2,
)

assert.equal(
  linkStates.get(nonBinaryReferent).linkCount,
  0,
)

assert.equal(
  memory.remove(nonBinaryWithReferent),
  true,
)

assert.equal(
  linkStates.get(valueLow).linkCount,
  1,
)

assert.equal(
  linkStates.get(nonBinaryReferent).linkCount,
  0,
)
// Higher match-goal level is inserted first
// in the preference-type ordering.
assert.equal(
  memory.add(highPreference),
  true,
)

assert.equal(
  highPreference.slot,
  slot,
)

assert.equal(
  slot!.allPreferences.length,
  2,
)
assert.equal(
  slot!.allPreferences[0],
  highPreference,
)

assert.equal(
  slot!.allPreferences[1],
  lowPreference,
)

assert.deepEqual(
  slot!.preferencesByType.get(
    'ACCEPTABLE',
  ),
  [lowPreference],
)

assert.deepEqual(
  slot!.preferencesByType.get(
    'BETTER',
  ),
  [highPreference],
)

// BETTER is binary: both value and referent
// must contribute structural links.
assert.equal(
  linkStates.get(valueHigh)
    .linkCount,
  1,
)

assert.equal(
  linkStates.get(referent)
    .linkCount,
  1,
)

// Check ordering inside one preference type.
const secondBetter:
  AZPreference = {
    type: 'BETTER',
    identifier: source,
    attribute,
    value: valueHigh,
    referent,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(3, 5),
  }

memory.add(secondBetter)

assert.deepEqual(
  slot!.preferencesByType.get(
    'BETTER',
  ),
  [
    secondBetter,
    highPreference,
  ],
)

// Same value/referent means one extra
// structural count for each.
assert.equal(
  linkStates.get(valueHigh)
    .linkCount,
  2,
)

assert.equal(
  linkStates.get(referent)
    .linkCount,
  2,
)

// Changed slot is buffered only once.
assert.equal(
  memory.takeNextChangedSlot(),
  slot,
)

assert.equal(
  memory.takeNextChangedSlot(),
  null,
)

// Removal restores preference state
// and structural link counts.
assert.equal(
  memory.remove(secondBetter),
  true,
)

assert.equal(
  secondBetter.inTemporaryMemory,
  false,
)

assert.equal(
  secondBetter.slot,
  null,
)

assert.equal(
  linkStates.get(valueHigh)
    .linkCount,
  1,
)

assert.equal(
  linkStates.get(referent)
    .linkCount,
  1,
)

assert.equal(
  memory.remove(highPreference),
  true,
)

assert.equal(
  linkStates.get(valueHigh)
    .linkCount,
  0,
)

assert.equal(
  linkStates.get(referent)
    .linkCount,
  0,
)

assert.equal(
  memory.remove(lowPreference),
  true,
)

assert.equal(
  linkStates.get(valueLow)
    .linkCount,
  0,
)

assert.equal(
  slot!.allPreferences.length,
  0,
)

assert.equal(
  slot!.preferencesByType.size,
  0,
)

// Empty slot can now be collected.
assert.equal(
  slot!.markedForPossibleRemoval,
  false,
)

memory.markSlotForPossibleRemoval(
  slot!,
)

assert.equal(
  slot!.markedForPossibleRemoval,
  true,
)

// Re-marking the same slot must be idempotent.
memory.markSlotForPossibleRemoval(
  slot!,
)

assert.equal(
  slot!.markedForPossibleRemoval,
  true,
)

const internalMemory =
  memory as unknown as {
    slotsForPossibleRemoval:
      unknown[]
  }

assert.equal(
  internalMemory
    .slotsForPossibleRemoval
    .length,
  1,
)

assert.equal(
  memory.removeGarbageSlots(),
  1,
)

assert.equal(
  memory.getSlot(
    source,
    attribute,
  ),
  null,
)

assert.deepEqual(
  memory.getSlotsForIdentifier(
    source,
  ),
  [],
)

/*
 * Historical garbage-slot retention:
 * a marked slot containing a preference survives collection
 * and its removal mark is cleared.
 */
const retainedAttribute =
  symbols.makeStringConstant('retained-garbage')

const retainedSlot =
  memory.getOrCreateContextSlot(
    source,
    retainedAttribute,
  )

const retainedPreference:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: source,
    attribute: retainedAttribute,
    value:
      symbols.makeStringConstant('retained-value'),
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(30, 1),
  }

memory.add(retainedPreference)
memory.markSlotForPossibleRemoval(
  retainedSlot,
)

assert.equal(
  memory.removeGarbageSlots(),
  0,
)

assert.equal(
  memory.getSlot(
    source,
    retainedAttribute,
  ),
  retainedSlot,
)

assert.equal(
  retainedSlot.markedForPossibleRemoval,
  false,
)

/*
 * Historical changed-slot garbage collection:
 * collecting an empty non-context slot must also remove
 * its pending changed-slot entry.
 */
const changedGarbageAttribute =
  symbols.makeStringConstant(
    'changed-garbage',
  )

const changedGarbageSlot =
  memory.getOrCreateContextSlot(
    source,
    changedGarbageAttribute,
  )

changedGarbageSlot.isaContextSlot = false

memory.markSlotAsChanged(
  changedGarbageSlot,
)

memory.markSlotForPossibleRemoval(
  changedGarbageSlot,
)

assert.equal(
  memory.removeGarbageSlots(),
  1,
)

assert.equal(
  memory.getSlot(
    source,
    changedGarbageAttribute,
  ),
  null,
)

assert.equal(
  memory.takeNextChangedSlot(),
  null,
)
/*
 * Historical slots-by-identifier contract:
 * multiple attributes belong to the same identifier,
 * while a distinct identifier remains isolated.
 */
const indexedIdentifier =
  symbols.makeIdentifier('I')

const indexedAttributeA =
  symbols.makeStringConstant('indexed-a')

const indexedAttributeB =
  symbols.makeStringConstant('indexed-b')

const otherIndexedIdentifier =
  symbols.makeIdentifier('I')

const indexedSlotA =
  memory.getOrCreateContextSlot(
    indexedIdentifier,
    indexedAttributeA,
  )

const indexedSlotB =
  memory.getOrCreateContextSlot(
    indexedIdentifier,
    indexedAttributeB,
  )

memory.getOrCreateContextSlot(
  otherIndexedIdentifier,
  indexedAttributeA,
)

const indexedSlots =
  memory.getSlotsForIdentifier(
    indexedIdentifier,
  )

assert.equal(
  indexedSlots.length,
  2,
)

assert.equal(
  indexedSlots.includes(indexedSlotA),
  true,
)

assert.equal(
  indexedSlots.includes(indexedSlotB),
  true,
)

assert.deepEqual(
  memory.getSlotsForIdentifier(
    symbols.makeIdentifier('I'),
  ),
  [],
)
/*
 * Historical changed-slot deduplication:
 * repeated add/remove mutations before consumption
 * must keep exactly one queued slot.
 */
const changedMemory =
  new AZPreferenceMemory()

const changedIdentifier =
  symbols.makeIdentifier('C')

const changedAttribute =
  symbols.makeStringConstant(
    'changed-slot',
  )

function makeChangedPreference(
  value: string,
  id: number,
): AZPreference {
  return {
    type: 'ACCEPTABLE',
    identifier: changedIdentifier,
    attribute: changedAttribute,
    value:
      symbols.makeStringConstant(value),
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(id, 1),
  }
}

const changedPreferenceA =
  makeChangedPreference('A', 20)

const changedPreferenceB =
  makeChangedPreference('B', 21)

changedMemory.add(changedPreferenceA)
changedMemory.add(changedPreferenceB)

const changedSlot =
  changedMemory.getSlot(
    changedIdentifier,
    changedAttribute,
  )

assert.notEqual(changedSlot, null)
assert.equal(changedSlot!.changed, true)

const changedInternal =
  changedMemory as unknown as {
    changedSlots: unknown[]
  }

assert.equal(
  changedInternal.changedSlots.length,
  1,
)

changedMemory.remove(changedPreferenceA)

assert.equal(
  changedInternal.changedSlots.length,
  1,
)

changedMemory.remove(changedPreferenceB)

assert.equal(
  changedInternal.changedSlots.length,
  1,
)
/*
 * Historical acceptable-preference changed contract.
 */
const acceptableMemory =
  new AZPreferenceMemory()

const acceptableGoal =
  symbols.makeIdentifier('A')

const acceptableOperator =
  symbols.makeStringConstant(
    'acceptable-operator',
  )

const acceptableNormalAttribute =
  symbols.makeStringConstant(
    'acceptable-normal',
  )

const acceptableContextSlot =
  acceptableMemory.getOrCreateContextSlot(
    acceptableGoal,
    acceptableOperator,
  )

function makeAcceptableChangePreference(
  type: AZPreference['type'],
  attribute: typeof acceptableOperator,
  id: number,
): AZPreference {
  return {
    type,
    identifier: acceptableGoal,
    attribute,
    value:
      symbols.makeIdentifier('O'),
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(id, 1),
  }
}

// ACCEPTABLE on context slot marks and enqueues.
const acceptableChanged =
  makeAcceptableChangePreference(
    'ACCEPTABLE',
    acceptableOperator,
    40,
  )

acceptableMemory.add(
  acceptableChanged,
)

assert.equal(
  acceptableContextSlot
    .acceptablePreferenceChanged,
  true,
)

assert.equal(
  acceptableMemory
    .takeNextAcceptablePreferenceChangedSlot(),
  acceptableContextSlot,
)

acceptableContextSlot
  .acceptablePreferenceChanged = false

// REQUIRE has the same notification semantics.
const requireChanged =
  makeAcceptableChangePreference(
    'REQUIRE',
    acceptableOperator,
    41,
  )

acceptableMemory.add(
  requireChanged,
)

assert.equal(
  acceptableContextSlot
    .acceptablePreferenceChanged,
  true,
)

assert.equal(
  acceptableMemory
    .takeNextAcceptablePreferenceChangedSlot(),
  acceptableContextSlot,
)

acceptableContextSlot
  .acceptablePreferenceChanged = false

// REJECT must not notify the acceptable-preference queue.
const rejectChanged =
  makeAcceptableChangePreference(
    'REJECT',
    acceptableOperator,
    42,
  )

acceptableMemory.add(
  rejectChanged,
)

assert.equal(
  acceptableContextSlot
    .acceptablePreferenceChanged,
  false,
)

assert.equal(
  acceptableMemory
    .takeNextAcceptablePreferenceChangedSlot(),
  null,
)

// ACCEPTABLE on a non-context slot must not notify.
const nonContextAcceptable =
  makeAcceptableChangePreference(
    'ACCEPTABLE',
    acceptableNormalAttribute,
    43,
  )

acceptableMemory.add(
  nonContextAcceptable,
)

const acceptableNormalSlot =
  acceptableMemory.getSlot(
    acceptableGoal,
    acceptableNormalAttribute,
  )

assert.notEqual(
  acceptableNormalSlot,
  null,
)

assert.equal(
  acceptableNormalSlot!.isaContextSlot,
  false,
)

assert.equal(
  acceptableNormalSlot!
    .acceptablePreferenceChanged,
  false,
)

assert.equal(
  acceptableMemory
    .takeNextAcceptablePreferenceChangedSlot(),
  null,
)

// Removing ACCEPTABLE from a context slot notifies again.
acceptableContextSlot
  .acceptablePreferenceChanged = false

acceptableMemory.remove(
  acceptableChanged,
)

assert.equal(
  acceptableContextSlot
    .acceptablePreferenceChanged,
  true,
)

assert.equal(
  acceptableMemory
    .takeNextAcceptablePreferenceChangedSlot(),
  acceptableContextSlot,
)

// Duplicate marks before consumption must enqueue once.
acceptableContextSlot
  .acceptablePreferenceChanged = false

acceptableMemory
  .markAcceptablePreferenceChanged(
    acceptableContextSlot,
  )

acceptableMemory
  .markAcceptablePreferenceChanged(
    acceptableContextSlot,
  )

assert.equal(
  acceptableMemory
    .takeNextAcceptablePreferenceChangedSlot(),
  acceptableContextSlot,
)

assert.equal(
  acceptableMemory
    .takeNextAcceptablePreferenceChangedSlot(),
  null,
)
console.log(
  'AZ autonomous preference memory lifecycle: OK',
)







