import assert from 'node:assert/strict'

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
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const memory =
  new AZPreferenceMemory()

const goal =
  symbols.makeIdentifier('S')

const otherGoal =
  symbols.makeIdentifier('S')

const target =
  symbols.makeIdentifier('T')

const attribute =
  symbols.makeStringConstant(
    'operator',
  )

const value1 =
  symbols.makeIdentifier('O')

const value2 =
  symbols.makeIdentifier('O')

const value3 =
  symbols.makeIdentifier('O')

function makeInstantiation(
  id: number,
  matchGoal:
    ReturnType<
      AZSymbolManager['makeIdentifier']
    >,
  matchGoalLevel: number,
): AZInstantiation {
  return {
    id,
    production: null,
    instantiatedConditions: [],
    matchGoal,
    matchGoalLevel,
    inMatchSet: true,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }
}

const goalInstantiation =
  makeInstantiation(
    1,
    goal,
    2,
  )

const otherInstantiation =
  makeInstantiation(
    2,
    otherGoal,
    2,
  )

const preferenceOnGoal:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: goal,
    attribute,
    value: value1,
    referent: null,
    level: 2,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      goalInstantiation,
  }

const preferenceOnOtherIdentifier:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: target,
    attribute,
    value: value2,
    referent: null,
    level: 2,
    numericValue: 0,
    oSupported: true,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      goalInstantiation,
  }

const preferenceFromOtherGoal:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: target,
    attribute,
    value: value3,
    referent: null,
    level: 2,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      otherInstantiation,
  }

goalInstantiation.generatedPreferences.push(
  preferenceOnGoal,
  preferenceOnOtherIdentifier,
)

otherInstantiation.generatedPreferences.push(
  preferenceFromOtherGoal,
)

assert.equal(
  memory.add(preferenceOnGoal),
  true,
)

assert.equal(
  memory.add(
    preferenceOnOtherIdentifier,
  ),
  true,
)

assert.equal(
  memory.add(
    preferenceFromOtherGoal,
  ),
  true,
)

const removed =
  memory.removePreferencesFromGoal(
    goal,
  )

assert.equal(
  removed,
  2,
)

assert.equal(
  preferenceOnGoal.inTemporaryMemory,
  false,
)

assert.equal(
  preferenceOnGoal.slot,
  null,
)

assert.equal(
  preferenceOnOtherIdentifier
    .inTemporaryMemory,
  false,
)

assert.equal(
  preferenceOnOtherIdentifier.slot,
  null,
)

assert.equal(
  preferenceFromOtherGoal
    .inTemporaryMemory,
  true,
)

assert.notEqual(
  preferenceFromOtherGoal.slot,
  null,
)

console.log(
  'AZ goal preference removal: OK',
)
