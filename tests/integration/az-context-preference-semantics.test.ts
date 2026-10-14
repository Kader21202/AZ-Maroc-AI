import assert from 'node:assert/strict'

import { AZDefaultCandidateSelectionPolicy } from '../../src/engines/cognitive/az/core/decision/AZDefaultCandidateSelectionPolicy'
import { AZDefaultContextPreferenceSemantics } from '../../src/engines/cognitive/az/core/decision/AZDefaultContextPreferenceSemantics'
import { AZDefaultContextSlotDecidability } from '../../src/engines/cognitive/az/core/decision/AZDefaultContextSlotDecidability'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZPreferenceSlot } from '../../src/engines/cognitive/az/core/operator/AZPreferenceSlot'
import type { AZPreferenceType } from '../../src/engines/cognitive/az/core/operator/AZPreferenceType'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbols =
  new AZSymbolManager()

const state =
  symbols.makeIdentifier('S')

const operator =
  symbols.makeStringConstant(
    'operator',
  )

const o1 =
  symbols.makeIdentifier('O')

const o2 =
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
  changed: true,
  markedForPossibleRemoval: false,
}

function makePreference(
  type: AZPreferenceType,
  value: AZSymbol,
  referent: AZSymbol | null = null,
): AZPreference {
  return {
    type,
    identifier: state,
    attribute: operator,
    value,
    referent,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: true,
    slot,
    instantiation: null,
  }
}

function setPreferences(
  preferences:
    readonly AZPreference[],
): void {
  slot.allPreferences.length = 0
  slot.preferencesByType.clear()

  for (const preference of preferences) {
    slot.allPreferences.push(
      preference,
    )

    const existing =
      slot.preferencesByType.get(
        preference.type,
      )

    if (existing === undefined) {
      slot.preferencesByType.set(
        preference.type,
        [preference],
      )
    } else {
      existing.push(preference)
    }
  }
}

/*
 * Deterministic random value:
 * numeric weighting can be tested
 * without making the test flaky.
 */
const semantics =
  new AZDefaultContextPreferenceSemantics(
    new AZDefaultCandidateSelectionPolicy(
      () => 0.75,
    ),
  )

const decidability =
  new AZDefaultContextSlotDecidability()

assert.equal(
  decidability.isDecidable(slot),
  true,
)

slot.changed = false

assert.equal(
  decidability.isDecidable(slot),
  false,
)

slot.changed = true

const dummyWme = {
  timetag: 1,
  identifier: state,
  attribute: operator,
  value: o1,
  acceptable: false,
}

slot.wmes.push(dummyWme)

assert.equal(
  decidability.isDecidable(slot),
  false,
)

slot.wmes.length = 0

/*
 * REQUIRE winner.
 */
const requireO1 =
  makePreference(
    'REQUIRE',
    o1,
  )

setPreferences([requireO1])

let result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'NONE',
)

assert.deepEqual(
  result.candidates,
  [requireO1],
)

/*
 * Multiple distinct REQUIRE values.
 */
const requireO2 =
  makePreference(
    'REQUIRE',
    o2,
  )

setPreferences([
  requireO1,
  requireO2,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'CONSTRAINT_FAILURE',
)

assert.equal(
  result.candidates.length,
  2,
)

/*
 * REQUIRE blocked by PROHIBIT.
 */
const prohibitO1 =
  makePreference(
    'PROHIBIT',
    o1,
  )

setPreferences([
  requireO1,
  prohibitO1,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'CONSTRAINT_FAILURE',
)

/*
 * Two ACCEPTABLE values => TIE.
 */
const acceptableO1 =
  makePreference(
    'ACCEPTABLE',
    o1,
  )

const acceptableO2 =
  makePreference(
    'ACCEPTABLE',
    o2,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'TIE',
)

assert.equal(
  result.candidates.length,
  2,
)

/*
 * PROHIBIT and REJECT remove candidates.
 */
setPreferences([
  acceptableO1,
  acceptableO2,
  prohibitO1,
])

result =
  semantics.evaluate(slot)

assert.deepEqual(
  result.candidates,
  [acceptableO2],
)

const rejectO2 =
  makePreference(
    'REJECT',
    o2,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  rejectO2,
])

result =
  semantics.evaluate(slot)

assert.deepEqual(
  result.candidates,
  [acceptableO1],
)

/*
 * BETTER.
 */
const betterO1OverO2 =
  makePreference(
    'BETTER',
    o1,
    o2,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  betterO1OverO2,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'NONE',
)

assert.deepEqual(
  result.candidates,
  [acceptableO1],
)

/*
 * Circular BETTER => CONFLICT.
 */
const betterO2OverO1 =
  makePreference(
    'BETTER',
    o2,
    o1,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  betterO1OverO2,
  betterO2OverO1,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'CONFLICT',
)

assert.equal(
  result.candidates.length,
  2,
)

/*
 * WORSE.
 */
const worseO2ThanO1 =
  makePreference(
    'WORSE',
    o2,
    o1,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  worseO2ThanO1,
])

result =
  semantics.evaluate(slot)

assert.deepEqual(
  result.candidates,
  [acceptableO1],
)

/*
 * BEST.
 */
const bestO1 =
  makePreference(
    'BEST',
    o1,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  bestO1,
])

result =
  semantics.evaluate(slot)

assert.deepEqual(
  result.candidates,
  [acceptableO1],
)

/*
 * WORST.
 */
const worstO2 =
  makePreference(
    'WORST',
    o2,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  worstO2,
])

result =
  semantics.evaluate(slot)

assert.deepEqual(
  result.candidates,
  [acceptableO1],
)

/*
 * If all candidates are WORST,
 * none is eliminated and TIE remains.
 */
const worstO1 =
  makePreference(
    'WORST',
    o1,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  worstO1,
  worstO2,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'TIE',
)

/*
 * UNARY_INDIFFERENT.
 */
const unaryO1 =
  makePreference(
    'UNARY_INDIFFERENT',
    o1,
  )

const unaryO2 =
  makePreference(
    'UNARY_INDIFFERENT',
    o2,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  unaryO1,
  unaryO2,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'NONE',
)

assert.equal(
  result.candidates.length,
  1,
)

/*
 * BINARY_INDIFFERENT.
 */
const binaryO1O2 =
  makePreference(
    'BINARY_INDIFFERENT',
    o1,
    o2,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  binaryO1O2,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'NONE',
)

assert.equal(
  result.candidates.length,
  1,
)

/*
 * NUMERIC_INDIFFERENT:
 * deterministic random 0.75 over weights
 * 10 + 20 selects O2.
 *
 * numericValue on candidates remains
 * untouched in AZ.
 */
const numeric10 =
  symbols.makeIntegerConstant(10)

const numeric20 =
  symbols.makeIntegerConstant(20)

const numericO1 =
  makePreference(
    'NUMERIC_INDIFFERENT',
    o1,
    numeric10,
  )

const numericO2 =
  makePreference(
    'NUMERIC_INDIFFERENT',
    o2,
    numeric20,
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  numericO1,
  numericO2,
])

result =
  semantics.evaluate(slot)

assert.equal(
  result.impasseType,
  'NONE',
)

assert.deepEqual(
  result.candidates,
  [acceptableO2],
)

assert.equal(
  acceptableO1.numericValue,
  0,
)

assert.equal(
  acceptableO2.numericValue,
  0,
)

/*
 * Invalid numeric referent.
 */
const invalidNumeric =
  makePreference(
    'NUMERIC_INDIFFERENT',
    o1,
    symbols.makeStringConstant(
      'invalid',
    ),
  )

setPreferences([
  acceptableO1,
  acceptableO2,
  invalidNumeric,
  numericO2,
])

assert.throws(
  () =>
    semantics.evaluate(slot),
  /NUMERIC_INDIFFERENT requires a numeric referent/,
)

console.log(
  'AZ context preference semantics: OK',
)
