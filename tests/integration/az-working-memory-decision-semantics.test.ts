import assert from 'node:assert/strict'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZAcceptablePreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/memory/AZAcceptablePreferenceWmeRegistry'
import {
  AZAcceptablePreferenceWmeChangesProcessor,
  AZAcceptablePreferenceWmeSynchronizer,
} from '../../src/engines/cognitive/az/core/memory/AZAcceptablePreferenceWmeSynchronizer'
import { AZNonContextPreferenceSemantics } from '../../src/engines/cognitive/az/core/decision/AZNonContextPreferenceSemantics'
import { AZNonContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZNonContextPreferenceWmeRegistry'
import {
  AZNonContextSlotDecider,
  AZNonContextSlotsDecider,
} from '../../src/engines/cognitive/az/core/decision/AZNonContextSlotDecider'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZPreferenceType } from '../../src/engines/cognitive/az/core/operator/AZPreferenceType'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbols = new AZSymbolManager()
const preferenceMemory = new AZPreferenceMemory()
const workingMemory = new AZWorkingMemory()

let nextInstantiationId = 1

function makeInstantiation(): AZInstantiation {
  return {
    id: nextInstantiationId++,
    production: null,
    instantiatedConditions: [],
    matchGoal: null,
    matchGoalLevel: 1,
    inMatchSet: true,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }
}

function makePreference(
  type: AZPreferenceType,
  identifier: AZSymbol,
  attribute: AZSymbol,
  value: AZSymbol,
): AZPreference {
  return {
    type,
    identifier,
    attribute,
    value,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation: makeInstantiation(),
  }
}

/*
 * Context slot: ACCEPTABLE/REQUIRE synchronization.
 */
const contextId = symbols.makeIdentifier('S')
const operatorAttr =
  symbols.makeStringConstant('operator')
const valueA = symbols.makeIdentifier('O')
const valueB = symbols.makeIdentifier('O')

const acceptableA =
  makePreference(
    'ACCEPTABLE',
    contextId,
    operatorAttr,
    valueA,
  )

const requireA =
  makePreference(
    'REQUIRE',
    contextId,
    operatorAttr,
    valueA,
  )

const acceptableB =
  makePreference(
    'ACCEPTABLE',
    contextId,
    operatorAttr,
    valueB,
  )

preferenceMemory.add(acceptableA)

const contextSlot =
  preferenceMemory.getSlot(
    contextId,
    operatorAttr,
  )

assert.notEqual(contextSlot, null)

if (contextSlot === null) {
  throw new Error('Context slot was not created')
}

contextSlot.isaContextSlot = true

preferenceMemory.add(requireA)
preferenceMemory.add(acceptableB)
preferenceMemory.markAcceptablePreferenceChanged(
  contextSlot,
)

const acceptableRegistry =
  new AZAcceptablePreferenceWmeRegistry()

const acceptableSynchronizer =
  new AZAcceptablePreferenceWmeSynchronizer(
    acceptableRegistry,
  )

const acceptableChanges =
  new AZAcceptablePreferenceWmeChangesProcessor()

acceptableChanges.processAll(
  preferenceMemory,
  workingMemory,
  acceptableSynchronizer,
)

assert.equal(
  contextSlot.acceptablePreferenceWmes.length,
  2,
  'duplicate ACCEPTABLE/REQUIRE values must produce one WME per value',
)

workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().filter(
    wme => wme.acceptable,
  ).length,
  2,
)

const originalA =
  contextSlot.acceptablePreferenceWmes.find(
    wme => wme.value === valueA,
  )

assert.notEqual(originalA, undefined)

preferenceMemory.remove(requireA)

acceptableChanges.processAll(
  preferenceMemory,
  workingMemory,
  acceptableSynchronizer,
)

const preservedA =
  contextSlot.acceptablePreferenceWmes.find(
    wme => wme.value === valueA,
  )

assert.equal(
  preservedA,
  originalA,
  'an existing valid acceptable WME must be preserved',
)

preferenceMemory.remove(acceptableB)

acceptableChanges.processAll(
  preferenceMemory,
  workingMemory,
  acceptableSynchronizer,
)

workingMemory.applyBufferedChanges()

assert.equal(
  contextSlot.acceptablePreferenceWmes.length,
  1,
)

assert.equal(
  contextSlot.acceptablePreferenceWmes[0]?.value,
  valueA,
)

/*
 * Non-context slot: ACCEPTABLE minus REJECT, deduplicated by value.
 */
/*
 * Historical acceptable-WME synchronizer contracts:
 * registry trace follows the preference that currently justifies
 * a preserved WME, and non-context slots are invalid input.
 */
assert.notEqual(
  originalA,
  undefined,
)

assert.equal(
  acceptableRegistry.get(originalA!),
  acceptableA,
  'preserved acceptable WME must trace to the remaining ACCEPTABLE preference',
)

const invalidContextAttribute =
  symbols.makeStringConstant(
    'invalid-acceptable-sync',
  )

const invalidContextPreference =
  makePreference(
    'ACCEPTABLE',
    contextId,
    invalidContextAttribute,
    symbols.makeIdentifier('O'),
  )

preferenceMemory.add(
  invalidContextPreference,
)

const invalidContextSlot =
  preferenceMemory.getSlot(
    contextId,
    invalidContextAttribute,
  )

assert.notEqual(
  invalidContextSlot,
  null,
)

assert.equal(
  invalidContextSlot!.isaContextSlot,
  false,
)

assert.throws(
  () => {
    acceptableSynchronizer.synchronize(
      invalidContextSlot!,
      workingMemory,
    )
  },
  /requires a context slot/,
)
const itemId = symbols.makeIdentifier('I')
const choiceAttr =
  symbols.makeStringConstant('choice')
const choiceA =
  symbols.makeStringConstant('A')
const choiceB =
  symbols.makeStringConstant('B')

const choiceA1 =
  makePreference(
    'ACCEPTABLE',
    itemId,
    choiceAttr,
    choiceA,
  )

const choiceA2 =
  makePreference(
    'ACCEPTABLE',
    itemId,
    choiceAttr,
    choiceA,
  )

const choiceBPreference =
  makePreference(
    'ACCEPTABLE',
    itemId,
    choiceAttr,
    choiceB,
  )

const rejectB =
  makePreference(
    'REJECT',
    itemId,
    choiceAttr,
    choiceB,
  )

preferenceMemory.add(choiceA1)
preferenceMemory.add(choiceA2)
preferenceMemory.add(choiceBPreference)
preferenceMemory.add(rejectB)

const nonContextSlot =
  preferenceMemory.getSlot(
    itemId,
    choiceAttr,
  )

assert.notEqual(nonContextSlot, null)

if (nonContextSlot === null) {
  throw new Error(
    'Non-context slot was not created',
  )
}

const nonContextRegistry =
  new AZNonContextPreferenceWmeRegistry()

const slotDecider =
  new AZNonContextSlotDecider(
    new AZNonContextPreferenceSemantics(),
    nonContextRegistry,
  )

const slotsDecider =
  new AZNonContextSlotsDecider(
    slotDecider,
  )

slotsDecider.decideAll(
  preferenceMemory,
  workingMemory,
)

assert.equal(
  nonContextSlot.wmes.length,
  1,
  'duplicate acceptable values must be deduplicated and rejected values excluded',
)

assert.equal(
  nonContextSlot.wmes[0]?.value,
  choiceA,
)

const originalChoiceWme =
  nonContextSlot.wmes[0]

const originalChoicePreference =
  nonContextRegistry.get(originalChoiceWme!)

assert.notEqual(
  originalChoicePreference,
  null,
  'materialized non-context WME must retain a causal preference association',
)

assert.equal(originalChoicePreference?.type, 'ACCEPTABLE')
assert.equal(originalChoicePreference?.identifier, originalChoiceWme?.identifier)
assert.equal(originalChoicePreference?.attribute, originalChoiceWme?.attribute)
assert.equal(originalChoicePreference?.value, originalChoiceWme?.value)

workingMemory.applyBufferedChanges()

preferenceMemory.markSlotAsChanged(
  nonContextSlot,
)

slotsDecider.decideAll(
  preferenceMemory,
  workingMemory,
)

assert.equal(
  nonContextSlot.wmes[0],
  originalChoiceWme,
  'an existing valid non-context WME must be preserved',
)

/*
 * Empty slot: remove WME then garbage-collect the slot.
 */
preferenceMemory.remove(choiceA1)
preferenceMemory.remove(choiceA2)
preferenceMemory.remove(choiceBPreference)
preferenceMemory.remove(rejectB)

slotsDecider.decideAll(
  preferenceMemory,
  workingMemory,
)

workingMemory.applyBufferedChanges()

assert.equal(
  nonContextSlot.wmes.length,
  0,
)

assert.equal(
  preferenceMemory.removeGarbageSlots(),
  1,
)

assert.equal(
  preferenceMemory.getSlot(
    itemId,
    choiceAttr,
  ),
  null,
)

/*
 * Historical acceptable-preference WME changes processor contract:
 * successful synchronization clears every processed flag and queue entry;
 * failed synchronization preserves the slot flag.
 */
const processorGoal1 =
  symbols.makeIdentifier('P')

const processorGoal2 =
  symbols.makeIdentifier('P')

const processorSlot1 =
  preferenceMemory.getOrCreateContextSlot(
    processorGoal1,
    operatorAttr,
  )

const processorSlot2 =
  preferenceMemory.getOrCreateContextSlot(
    processorGoal2,
    operatorAttr,
  )

preferenceMemory
  .markAcceptablePreferenceChanged(
    processorSlot1,
  )

preferenceMemory
  .markAcceptablePreferenceChanged(
    processorSlot2,
  )

const synchronizedProcessorSlots:
  unknown[] = []

const recordingSynchronizer = {
  synchronize(
    slot: typeof processorSlot1,
  ): void {
    synchronizedProcessorSlots.push(
      slot,
    )
  },
} as unknown as AZAcceptablePreferenceWmeSynchronizer

acceptableChanges.processAll(
  preferenceMemory,
  workingMemory,
  recordingSynchronizer,
)

assert.equal(
  synchronizedProcessorSlots.length,
  2,
)

assert.equal(
  synchronizedProcessorSlots.includes(
    processorSlot1,
  ),
  true,
)

assert.equal(
  synchronizedProcessorSlots.includes(
    processorSlot2,
  ),
  true,
)

assert.equal(
  processorSlot1.acceptablePreferenceChanged,
  false,
)

assert.equal(
  processorSlot2.acceptablePreferenceChanged,
  false,
)

assert.equal(
  preferenceMemory
    .takeNextAcceptablePreferenceChangedSlot(),
  null,
)

// A failed synchronization must not clear the flag.
preferenceMemory
  .markAcceptablePreferenceChanged(
    processorSlot1,
  )

const failingSynchronizer = {
  synchronize(): void {
    throw new Error(
      'Expected synchronization failure',
    )
  },
} as unknown as AZAcceptablePreferenceWmeSynchronizer

assert.throws(
  () => {
    acceptableChanges.processAll(
      preferenceMemory,
      workingMemory,
      failingSynchronizer,
    )
  },
  /Expected synchronization failure/,
)

assert.equal(
  processorSlot1.acceptablePreferenceChanged,
  true,
)
console.log(
  'AZ working-memory decision semantics: OK',
)






