import assert from 'node:assert/strict'

import { AZImpasseItemBacktraceRegistry } from '../../src/engines/cognitive/az/core/decision/AZImpasseItemBacktraceRegistry'
import { AZImpasseItemsUpdater } from '../../src/engines/cognitive/az/core/decision/AZImpasseItemsUpdater'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZPreferenceSlot } from '../../src/engines/cognitive/az/core/operator/AZPreferenceSlot'
import { AZImpasseItemInstantiationCreator } from '../../src/engines/cognitive/az/core/production/AZImpasseItemInstantiationCreator'
import {
  AZDefaultGoalStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import {
  AZDefaultGoalStructuralStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbolManager =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(
    symbolManager,
  )

const workingMemory =
  new AZWorkingMemory()

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const structuralRegistry =
  new AZDefaultGoalStructuralStateRegistry()

const backtraceRegistry =
  new AZImpasseItemBacktraceRegistry()

const creator =
  new AZImpasseItemInstantiationCreator(
    predefinedSymbols,
    goalStateRegistry,
    structuralRegistry,
  )

const updater =
  new AZImpasseItemsUpdater(
    predefinedSymbols,
    symbolManager,
    creator,
    backtraceRegistry,
    structuralRegistry,
  )

const superstate =
  symbolManager.makeIdentifier('S')

const goal =
  symbolManager.makeIdentifier('S')

goalStateRegistry.registerGoal(
  goal,
  2,
)

const superstateWme =
  workingMemory.createElement(
    goal,
    predefinedSymbols.superstate,
    superstate,
    false,
  )

structuralRegistry.register(
  goal,
  {
    impasseWmes: [
      superstateWme,
    ],
  },
)

const valueA =
  symbolManager.makeIdentifier('O')

const valueB =
  symbolManager.makeIdentifier('O')

const acceptableA =
  workingMemory.createElement(
    superstate,
    predefinedSymbols.operator,
    valueA,
    true,
  )

const acceptableB =
  workingMemory.createElement(
    superstate,
    predefinedSymbols.operator,
    valueB,
    true,
  )

const slot:
  AZPreferenceSlot = {
    identifier: superstate,
    attribute:
      predefinedSymbols.operator,
    allPreferences: [],
    preferencesByType:
      new Map(),
    wmes: [],
    isaContextSlot: true,
    impasseType: 'NONE',
    impasseId: null,
    acceptablePreferenceChanged: false,
    acceptablePreferenceWmes: [
      acceptableA,
      acceptableB,
    ],
    changed: false,
    markedForPossibleRemoval: false,
  }

const makePreference = (
  value:
    typeof valueA,
): AZPreference => ({
  type: 'ACCEPTABLE',
  identifier: superstate,
  attribute:
    predefinedSymbols.operator,
  value,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: true,
  slot,
  instantiation: null,
})

const candidateA =
  makePreference(valueA)

const candidateB =
  makePreference(valueB)

const numericB:
  AZPreference = {
    ...makePreference(valueB),
    type: 'NUMERIC_INDIFFERENT',
    referent: valueB,
  }

slot.allPreferences.push(
  candidateA,
  candidateB,
  numericB,
)

slot.preferencesByType.set(
  'ACCEPTABLE',
  [
    candidateA,
    candidateB,
  ],
)

slot.preferencesByType.set(
  'NUMERIC_INDIFFERENT',
  [
    numericB,
  ],
)

/*
 * First update:
 *
 * regular pass:
 *   item A
 *   item B
 *   item-count 2
 *
 * numeric pass:
 *   non-numeric A
 *   non-numeric-count 1
 *
 * B is excluded from non-numeric because it
 * carries NUMERIC_INDIFFERENT.
 */
updater.update(
  goal,
  [
    candidateA,
    candidateB,
  ],
  workingMemory,
)

workingMemory.applyBufferedChanges()

const firstState =
  structuralRegistry.get(goal)

const regularItems =
  firstState.impasseWmes.filter(
    (wme) =>
      wme.attribute ===
      predefinedSymbols.item,
  )

const nonNumericItems =
  firstState.impasseWmes.filter(
    (wme) =>
      wme.attribute ===
      predefinedSymbols.nonNumeric,
  )

const itemCounts =
  firstState.impasseWmes.filter(
    (wme) =>
      wme.attribute ===
      predefinedSymbols.itemCount,
  )

const nonNumericCounts =
  firstState.impasseWmes.filter(
    (wme) =>
      wme.attribute ===
      predefinedSymbols.nonNumericCount,
  )

assert.equal(
  regularItems.length,
  2,
)

assert.equal(
  nonNumericItems.length,
  1,
)

assert.equal(
  itemCounts.length,
  1,
)

assert.equal(
  itemCounts[0]?.value.value,
  2,
)

assert.equal(
  nonNumericCounts.length,
  1,
)

assert.equal(
  nonNumericCounts[0]?.value.value,
  1,
)

assert.equal(
  nonNumericItems[0]?.value,
  valueA,
)

const regularB =
  regularItems.find(
    (wme) =>
      wme.value === valueB,
  )

assert.ok(regularB)

const backtrace =
  backtraceRegistry.get(
    regularB,
  )

assert.ok(backtrace)

assert.equal(
  backtrace.identifier,
  goal,
)

assert.equal(
  backtrace.attribute,
  predefinedSymbols.item,
)

assert.equal(
  backtrace.value,
  valueB,
)

assert.equal(
  backtrace.instantiation?.production,
  null,
)

assert.equal(
  backtrace.instantiation?.matchGoal,
  goal,
)

assert.equal(
  backtrace.instantiation?.matchGoalLevel,
  2,
)

assert.equal(
  backtrace.instantiation
    ?.instantiatedConditions.length,
  2,
)
assert.equal(
  backtrace.type,
  'ACCEPTABLE',
)

assert.equal(
  backtrace.identifier,
  goal,
)

assert.equal(
  backtrace.attribute,
  predefinedSymbols.item,
)

assert.equal(
  backtrace.value,
  valueB,
)

assert.equal(
  backtrace.referent,
  null,
)

assert.equal(
  backtrace.level,
  0,
)

assert.equal(
  backtrace.oSupported,
  false,
)

assert.equal(
  backtrace.inTemporaryMemory,
  false,
)

assert.equal(
  backtrace.slot,
  null,
)

assert.equal(
  backtrace.instantiation
    ?.generatedPreferences.length,
  1,
)

assert.equal(
  backtrace.instantiation
    ?.generatedPreferences[0],
  backtrace,
)

assert.equal(
  backtrace.instantiation
    ?.instantiatedConditions[0]
    ?.type,
  'POSITIVE',
)

assert.equal(
  backtrace.instantiation
    ?.instantiatedConditions[0]
    ?.workingMemoryElement,
  acceptableB,
)

assert.equal(
  backtrace.instantiation
    ?.instantiatedConditions[1]
    ?.type,
  'POSITIVE',
)

assert.equal(
  backtrace.instantiation
    ?.instantiatedConditions[1]
    ?.workingMemoryElement,
  superstateWme,
)

assert.equal(
  backtrace.instantiation?.inMatchSet,
  false,
)

assert.equal(
  backtrace.instantiation?.reteToken,
  null,
)

assert.equal(
  backtrace.instantiation?.reteWme,
  null,
)

/*
 * Second update:
 * retain only candidate B.
 *
 * Its regular ^item WME must be reused.
 * Since B is numeric-indifferent, the
 * non-numeric pass must become empty.
 */
updater.update(
  goal,
  [
    candidateB,
  ],
  workingMemory,
)

workingMemory.applyBufferedChanges()

const secondState =
  structuralRegistry.get(goal)

const secondRegularItems =
  secondState.impasseWmes.filter(
    (wme) =>
      wme.attribute ===
      predefinedSymbols.item,
  )

assert.equal(
  secondRegularItems.length,
  1,
)

assert.equal(
  secondRegularItems[0],
  regularB,
)

assert.equal(
  secondState.impasseWmes.filter(
    (wme) =>
      wme.attribute ===
      predefinedSymbols.nonNumeric,
  ).length,
  0,
)

assert.equal(
  secondState.impasseWmes.filter(
    (wme) =>
      wme.attribute ===
      predefinedSymbols.nonNumericCount,
  ).length,
  0,
)

const refreshedBacktrace =
  backtraceRegistry.get(
    regularB,
  )

assert.ok(refreshedBacktrace)

assert.notEqual(
  refreshedBacktrace,
  backtrace,
)

/*
 * Third update:
 * no candidates -> remove all dynamic
 * impasse items and counters.
 */
updater.update(
  goal,
  [],
  workingMemory,
)

workingMemory.applyBufferedChanges()

const finalState =
  structuralRegistry.get(goal)

assert.equal(
  finalState.impasseWmes.filter(
    (wme) =>
      wme.attribute ===
        predefinedSymbols.item ||
      wme.attribute ===
        predefinedSymbols.itemCount ||
      wme.attribute ===
        predefinedSymbols.nonNumeric ||
      wme.attribute ===
        predefinedSymbols.nonNumericCount,
  ).length,
  0,
)

assert.equal(
  backtraceRegistry.has(
    regularB,
  ),
  false,
)

assert.equal(
  finalState.impasseWmes.includes(
    superstateWme,
  ),
  true,
)

console.log(
  'AZ impasse items updater: OK',
)

