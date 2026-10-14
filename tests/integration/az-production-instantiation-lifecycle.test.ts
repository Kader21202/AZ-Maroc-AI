import assert from 'node:assert/strict'

import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZInstantiationRetractor } from '../../src/engines/cognitive/az/core/production/AZInstantiationRetractor'
import { AZNewPreferenceAsserter } from '../../src/engines/cognitive/az/core/production/AZNewPreferenceAsserter'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const preferenceMemory =
  new AZPreferenceMemory()

const asserter =
  new AZNewPreferenceAsserter(
    preferenceMemory,
  )

const retractor =
  new AZInstantiationRetractor(
    preferenceMemory,
  )

const production: AZProduction = {
  name: 'az-preference-lifecycle',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const identifier =
  symbols.makeIdentifier('S')

const attribute =
  symbols.makeStringConstant('choice')

const value =
  symbols.makeStringConstant('candidate')

function makeInstantiation(
  id: number,
): AZInstantiation {
  return {
    id,
    production,
    instantiatedConditions: [],
    matchGoal: identifier,
    matchGoalLevel: 1,
    inMatchSet: true,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }
}

function makePreference(
  instantiation: AZInstantiation,
  type: AZPreference['type'],
  oSupported: boolean,
): AZPreference {
  return {
    type,
    identifier,
    attribute,
    value,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported,
    inTemporaryMemory: false,
    slot: null,
    instantiation,
  }
}

/*
 * 1. Normal assertion:
 *    - runtime instantiation is registered
 *    - preference enters temporary memory
 */
const normalInstantiation =
  makeInstantiation(1)

const normalPreference =
  makePreference(
    normalInstantiation,
    'ACCEPTABLE',
    false,
  )

normalInstantiation
  .generatedPreferences
  .push(normalPreference)

const normalResult =
  asserter.assert([
    normalInstantiation,
  ])

assert.deepEqual(
  normalResult.assertedInstantiations,
  [normalInstantiation],
)

assert.equal(
  normalResult.rejectedPreferencesProcessed,
  0,
)

assert.equal(
  production.instantiations.includes(
    normalInstantiation,
  ),
  true,
)

assert.equal(
  normalPreference.inTemporaryMemory,
  true,
)

assert.equal(
  preferenceMemory
    .getSlot(
      identifier,
      attribute,
    )
    ?.allPreferences
    .includes(normalPreference),
  true,
)

/*
 * 2. Normal retraction:
 *    - preference leaves temporary memory
 *    - runtime instantiation disappears
 */
retractor.retract(
  normalInstantiation,
)

assert.equal(
  normalInstantiation.inMatchSet,
  false,
)

assert.equal(
  normalPreference.inTemporaryMemory,
  false,
)

assert.equal(
  production.instantiations.includes(
    normalInstantiation,
  ),
  false,
)

/*
 * 3. Recreate an existing preference,
 *    then apply an o-supported REJECT
 *    having the same slot/value.
 */
const existingInstantiation =
  makeInstantiation(2)

const existingPreference =
  makePreference(
    existingInstantiation,
    'ACCEPTABLE',
    false,
  )

existingInstantiation
  .generatedPreferences
  .push(existingPreference)

asserter.assert([
  existingInstantiation,
])

assert.equal(
  existingPreference.inTemporaryMemory,
  true,
)

const rejectInstantiation =
  makeInstantiation(3)

const rejectPreference =
  makePreference(
    rejectInstantiation,
    'REJECT',
    true,
  )

rejectInstantiation
  .generatedPreferences
  .push(rejectPreference)

const rejectResult =
  asserter.assert([
    rejectInstantiation,
  ])

assert.equal(
  rejectResult.rejectedPreferencesProcessed,
  1,
)

assert.equal(
  existingPreference.inTemporaryMemory,
  false,
)

assert.equal(
  rejectPreference.inTemporaryMemory,
  false,
)

assert.equal(
  preferenceMemory
    .getSlot(
      identifier,
      attribute,
    )
    ?.allPreferences
    .includes(existingPreference),
  false,
)

assert.equal(
  production.instantiations.includes(
    rejectInstantiation,
  ),
  true,
)

/*
 * 4. Final runtime cleanup.
 */
retractor.retract(
  rejectInstantiation,
)

retractor.retract(
  existingInstantiation,
)

assert.equal(
  production.instantiations.length,
  0,
)

/*
 * Historical NewPreferenceAsserter contract:
 * o-supported REJECTs are processed before
 * ordinary preferences from the same assertion.
 */
const survivingValue =
  symbols.makeStringConstant('survivor')

const survivingInstantiation =
  makeInstantiation(40)

const survivingPreference: AZPreference = {
  ...makePreference(
    survivingInstantiation,
    'ACCEPTABLE',
    false,
  ),
  value: survivingValue,
}

survivingInstantiation
  .generatedPreferences
  .push(survivingPreference)

asserter.assert([
  survivingInstantiation,
])

const historicalInstantiation =
  makeInstantiation(41)

const historicalReject =
  makePreference(
    historicalInstantiation,
    'REJECT',
    true,
  )

const historicalNormal =
  makePreference(
    historicalInstantiation,
    'ACCEPTABLE',
    true,
  )

historicalInstantiation
  .generatedPreferences
  .push(
    historicalReject,
    historicalNormal,
  )

const historicalResult =
  asserter.assert([
    historicalInstantiation,
  ])

assert.equal(
  historicalResult.rejectedPreferencesProcessed,
  1,
)

assert.equal(
  historicalReject.inTemporaryMemory,
  false,
)

assert.equal(
  historicalReject.slot,
  null,
)

assert.equal(
  historicalNormal.inTemporaryMemory,
  true,
)

assert.equal(
  survivingPreference.inTemporaryMemory,
  true,
)

const historicalSlot =
  preferenceMemory.getSlot(
    identifier,
    attribute,
  )

assert.equal(
  historicalSlot?.allPreferences.includes(
    historicalNormal,
  ),
  true,
)

assert.equal(
  historicalSlot?.allPreferences.includes(
    survivingPreference,
  ),
  true,
)

assert.equal(
  historicalSlot?.allPreferences.includes(
    existingPreference,
  ),
  false,
)

retractor.retract(
  historicalInstantiation,
)

retractor.retract(
  survivingInstantiation,
)
/*
 * 5. O-supported preference survives
 *    instantiation retraction.
 */
const oInstantiation =
  makeInstantiation(4)

const oPreference =
  makePreference(
    oInstantiation,
    'ACCEPTABLE',
    true,
  )

oInstantiation
  .generatedPreferences
  .push(oPreference)

asserter.assert([
  oInstantiation,
])

assert.equal(
  oPreference.inTemporaryMemory,
  true,
)

retractor.retract(
  oInstantiation,
)

assert.equal(
  oPreference.inTemporaryMemory,
  true,
)

assert.notEqual(
  oPreference.slot,
  null,
)

assert.equal(
  production.instantiations.includes(
    oInstantiation,
  ),
  false,
)

assert.equal(
  oInstantiation.inMatchSet,
  false,
)

/*
 * 6. Architectural instantiation:
 *    production === null is tolerated.
 */
const architecturalInstantiation:
  AZInstantiation = {
    ...makeInstantiation(5),
    production: null,
  }

retractor.retract(
  architecturalInstantiation,
)

assert.equal(
  architecturalInstantiation.inMatchSet,
  false,
)
console.log(
  'AZ autonomous instantiation/preference lifecycle: OK',
)


