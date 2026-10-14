import assert from 'node:assert/strict'

import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZSubstateResultDetector } from '../../src/engines/cognitive/az/core/production/AZSubstateResultDetector'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const goals = new AZDefaultGoalIdentityRegistry()

const s1 = symbols.makeIdentifier('S')
const s4 = symbols.makeIdentifier('S')
const phase = symbols.makeStringConstant('phase')
const one = symbols.makeStringConstant('one')
const two = symbols.makeStringConstant('two')

goals.registerGoal(s1, 1)
goals.registerGoal(s4, 2)

const instantiation: AZInstantiation = {
  id: 1,
  production: null,
  instantiatedConditions: [],
  matchGoal: s4,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

function preference(
  identifier: AZSymbol,
  type: AZPreference['type'],
  value: AZSymbol,
): AZPreference {
  return {
    type,
    identifier,
    attribute: phase,
    value,
    referent: null,
    level: goals.getLevel(identifier),
    numericValue: 0,
    oSupported: true,
    inTemporaryMemory: true,
    slot: null,
    instantiation,
  }
}

const rejectOne = preference(s1, 'REJECT', one)
const acceptTwo = preference(s1, 'ACCEPTABLE', two)
const localS4 = preference(s4, 'ACCEPTABLE', one)

instantiation.generatedPreferences.push(
  rejectOne,
  acceptTwo,
  localS4,
)

const detector =
  new AZSubstateResultDetector(goals)

assert.deepEqual(
  detector.detect(instantiation),
  [rejectOne, acceptTwo],
  'Only preferences targeting a goal above the match goal are substate results.',
)

console.log('AZ substate result detection: OK')
