import assert from 'node:assert/strict'

import {
  AZContextSlotWmeRemover,
} from '../../src/engines/cognitive/az/core/decision/AZContextSlotWmeRemover'
import {
  AZContextPreferenceWmeRegistry,
} from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceWmeRegistry'
import {
  AZWorkingMemory,
} from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type {
  AZPreferenceSlot,
} from '../../src/engines/cognitive/az/core/operator/AZPreferenceSlot'
import type {
  AZPreference,
} from '../../src/engines/cognitive/az/core/operator/AZPreference'
import {
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const contextPreferenceWmeRegistry =
  new AZContextPreferenceWmeRegistry()

const remover =
  new AZContextSlotWmeRemover(
    contextPreferenceWmeRegistry,
  )

const state =
  symbols.makeIdentifier('S')

const operator =
  symbols.makeStringConstant(
    'operator',
  )

const selectedOperator =
  symbols.makeIdentifier('O')

const slot: AZPreferenceSlot = {
  identifier: state,
  attribute: operator,
  allPreferences: [],
  preferencesByType: new Map(),
  wmes: [],
  isaContextSlot: true,
  impasseType: 'NONE',
  impasseId: null,
  acceptablePreferenceChanged: false,
  acceptablePreferenceWmes: [],
  changed: false,
  markedForPossibleRemoval: false,
}

const wme =
  workingMemory.createElement(
    state,
    operator,
    selectedOperator,
    false,
  )

slot.wmes.push(wme)


const selectedPreference: AZPreference = {
  type: 'ACCEPTABLE',
  identifier: state,
  attribute: operator,
  value: selectedOperator,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: true,
  slot,
  instantiation: null,
}

contextPreferenceWmeRegistry.set(
  wme,
  selectedPreference,
)
workingMemory.scheduleAdd(wme)
workingMemory.applyBufferedChanges()

assert.deepEqual(
  workingMemory.getElements(),
  [wme],
)

assert.equal(
  contextPreferenceWmeRegistry.get(wme),
  selectedPreference,
)

remover.remove(
  slot,
  workingMemory,
)

assert.equal(
  slot.wmes.length,
  0,
)
assert.equal(
  contextPreferenceWmeRegistry.get(wme),
  null,
)

/*
 * Removal is buffered: the WME remains
 * visible until working-memory changes
 * are applied.
 */
assert.deepEqual(
  workingMemory.getElements(),
  [wme],
)

workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().length,
  0,
)

/*
 * A normal slot must never be treated
 * as a context slot.
 */
const ordinarySlot: AZPreferenceSlot = {
  ...slot,
  wmes: [],
  isaContextSlot: false,
}

assert.throws(
  () =>
    remover.remove(
      ordinarySlot,
      workingMemory,
    ),
  /context slot/i,
)

console.log(
  'AZ context slot WME remover: OK',
)



