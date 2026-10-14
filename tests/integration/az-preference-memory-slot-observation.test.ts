import assert from 'node:assert/strict'

import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbolManager =
  new AZSymbolManager()

const preferenceMemory =
  new AZPreferenceMemory()

const firstIdentifier =
  symbolManager.makeIdentifier('S')

const secondIdentifier =
  symbolManager.makeIdentifier('S')

const operatorAttribute =
  symbolManager.makeStringConstant(
    'operator',
  )

const stateAttribute =
  symbolManager.makeStringConstant(
    'state',
  )

const firstSlot =
  preferenceMemory.getOrCreateContextSlot(
    firstIdentifier,
    operatorAttribute,
  )

const secondSlot =
  preferenceMemory.getOrCreateContextSlot(
    secondIdentifier,
    stateAttribute,
  )

const slots =
  preferenceMemory.getSlots()

assert.equal(
  slots.length,
  2,
)

assert.equal(
  slots.includes(firstSlot),
  true,
)

assert.equal(
  slots.includes(secondSlot),
  true,
)

assert.equal(
  preferenceMemory.getSlots().length,
  2,
  'observing slots must not consume preference-memory state',
)

console.log(
  'AZ preference-memory slot observation: OK',
)

const changedBefore =
  preferenceMemory.getChangedSlots()

const acceptableBefore =
  preferenceMemory
    .getAcceptablePreferenceChangedSlots()

const removalBefore =
  preferenceMemory
    .getSlotsForPossibleRemoval()

assert.deepEqual(
  preferenceMemory.getChangedSlots(),
  changedBefore,
  'observing changed-slot order must not consume preference-memory state',
)

assert.deepEqual(
  preferenceMemory
    .getAcceptablePreferenceChangedSlots(),
  acceptableBefore,
  'observing acceptable-preference changed-slot order must not consume preference-memory state',
)

assert.deepEqual(
  preferenceMemory
    .getSlotsForPossibleRemoval(),
  removalBefore,
  'observing possible-removal slot order must not consume preference-memory state',
)

console.log(
  'AZ preference-memory queue observation: OK',
)
