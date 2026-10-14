import assert from 'node:assert/strict'

import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZQStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZQStructuralStateExtractor'
import { AZWorkingMemoryStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZWorkingMemoryStructuralStateExtractor'

const symbolManager =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const preferenceMemory =
  new AZPreferenceMemory()

const matchSet =
  new AZMatchSet()

const state =
  symbolManager.makeIdentifier('S')

const operatorAttribute =
  symbolManager.makeStringConstant(
    'operator',
  )

const operator =
  symbolManager.makeIdentifier('O')

const element =
  workingMemory.createElement(
    state,
    operatorAttribute,
    operator,
  )

workingMemory.scheduleAdd(element)
workingMemory.applyBufferedChanges()

preferenceMemory.getOrCreateContextSlot(
  state,
  operatorAttribute,
)

const observation =
  new AZQStructuralStateExtractor()
    .extract(
      workingMemory,
      preferenceMemory,
      matchSet,
    )

assert.equal(
  observation.workingMemory.length,
  1,
)

assert.equal(
  observation.preferenceSlots.length,
  1,
)

const observedWme =
  observation.workingMemory[0]

const observedSlot =
  observation.preferenceSlots[0]

assert.equal(
  observedWme.identifier.type,
  'IDENTIFIER',
)

assert.equal(
  observedSlot.identifier.type,
  'IDENTIFIER',
)

if (
  observedWme.identifier.type !==
    'IDENTIFIER' ||
  observedSlot.identifier.type !==
    'IDENTIFIER'
) {
  throw new Error(
    'Expected identifier observations',
  )
}

assert.equal(
  observedWme.identifier.technicalId,
  observedSlot.identifier.technicalId,
  'the same AZ symbol must retain the same technical identity across WM and preference observations',
)

assert.equal(
  observedSlot.impasseType,
  'NONE',
)

assert.equal(
  observedSlot.preferences.length,
  0,
)

console.log(
  'AZ Q structural-state extraction: OK',
)

const secondState =
  symbolManager.makeIdentifier('S')

const secondAttribute =
  symbolManager.makeStringConstant(
    'secondary',
  )

const firstSlot =
  preferenceMemory.getSlot(
    state,
    operatorAttribute,
  )

assert.notEqual(
  firstSlot,
  null,
)

if (firstSlot === null) {
  throw new Error(
    'Expected first preference slot',
  )
}

const secondSlot =
  preferenceMemory.getOrCreateContextSlot(
    secondState,
    secondAttribute,
  )

preferenceMemory.markAcceptablePreferenceChanged(
  firstSlot,
)

preferenceMemory.markAcceptablePreferenceChanged(
  secondSlot,
)

preferenceMemory.markSlotForPossibleRemoval(
  firstSlot,
)

preferenceMemory.markSlotForPossibleRemoval(
  secondSlot,
)

const queuedObservation =
  new AZQStructuralStateExtractor()
    .extract(
      workingMemory,
      preferenceMemory,
      matchSet,
    )

assert.equal(
  queuedObservation
    .acceptablePreferenceChangedSlots
    .length,
  2,
)

assert.equal(
  queuedObservation
    .slotsForPossibleRemoval
    .length,
  2,
)

const acceptableFirst =
  queuedObservation
    .acceptablePreferenceChangedSlots[0]

const acceptableSecond =
  queuedObservation
    .acceptablePreferenceChangedSlots[1]

const removalFirst =
  queuedObservation
    .slotsForPossibleRemoval[0]

const removalSecond =
  queuedObservation
    .slotsForPossibleRemoval[1]

assert.deepEqual(
  acceptableFirst,
  {
    identifier:
      new AZWorkingMemoryStructuralStateExtractor()
        .observeSymbol(secondState),
    attribute:
      new AZWorkingMemoryStructuralStateExtractor()
        .observeSymbol(secondAttribute),
  },
  'acceptable-preference queue order must preserve unshift semantics',
)

assert.deepEqual(
  acceptableSecond,
  {
    identifier:
      new AZWorkingMemoryStructuralStateExtractor()
        .observeSymbol(state),
    attribute:
      new AZWorkingMemoryStructuralStateExtractor()
        .observeSymbol(operatorAttribute),
  },
)

assert.deepEqual(
  removalFirst,
  {
    identifier:
      new AZWorkingMemoryStructuralStateExtractor()
        .observeSymbol(state),
    attribute:
      new AZWorkingMemoryStructuralStateExtractor()
        .observeSymbol(operatorAttribute),
  },
  'possible-removal queue order must preserve push semantics',
)

assert.deepEqual(
  removalSecond,
  {
    identifier:
      new AZWorkingMemoryStructuralStateExtractor()
        .observeSymbol(secondState),
    attribute:
      new AZWorkingMemoryStructuralStateExtractor()
        .observeSymbol(secondAttribute),
  },
)

console.log(
  'AZ Q preference-memory queue order: OK',
)

function makeQueueInstantiation(
  id: number,
): AZInstantiation {
  return {
    id,
    production: null,
    instantiatedConditions: [],
    matchGoal: null,
    matchGoalLevel: 1,
    inMatchSet: false,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }
}

const nonContextMemory =
  new AZPreferenceMemory()

const nonContextIdentifier =
  symbolManager.makeIdentifier('N')

const firstNonContextAttribute =
  symbolManager.makeStringConstant(
    'first-non-context',
  )

const secondNonContextAttribute =
  symbolManager.makeStringConstant(
    'second-non-context',
  )

function makeQueuePreference(
  attribute: typeof firstNonContextAttribute,
  value: string,
  id: number,
): AZPreference {
  return {
    type: 'ACCEPTABLE',
    identifier: nonContextIdentifier,
    attribute,
    value:
      symbolManager.makeStringConstant(
        value,
      ),
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeQueueInstantiation(id),
  }
}

nonContextMemory.add(
  makeQueuePreference(
    firstNonContextAttribute,
    'first-value',
    1001,
  ),
)

nonContextMemory.add(
  makeQueuePreference(
    secondNonContextAttribute,
    'second-value',
    1002,
  ),
)

const nonContextObservation =
  new AZQStructuralStateExtractor()
    .extract(
      workingMemory,
      nonContextMemory,
      matchSet,
    )

assert.equal(
  nonContextObservation.changedSlots.length,
  2,
)

const symbolObserver =
  new AZWorkingMemoryStructuralStateExtractor()

assert.deepEqual(
  nonContextObservation.changedSlots[0],
  {
    identifier:
      symbolObserver.observeSymbol(
        nonContextIdentifier,
      ),
    attribute:
      symbolObserver.observeSymbol(
        secondNonContextAttribute,
      ),
  },
  'changed-slot queue order must preserve unshift semantics',
)

assert.deepEqual(
  nonContextObservation.changedSlots[1],
  {
    identifier:
      symbolObserver.observeSymbol(
        nonContextIdentifier,
      ),
    attribute:
      symbolObserver.observeSymbol(
        firstNonContextAttribute,
      ),
  },
)

console.log(
  'AZ Q non-context changed-slot order: OK',
)
