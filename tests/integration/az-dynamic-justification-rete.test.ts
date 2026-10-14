import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZJustificationMaterializer } from '../../src/engines/cognitive/az/core/production/AZJustificationMaterializer'
import { AZProductionRuntimeAssembly } from '../../src/engines/cognitive/az/core/production/AZProductionRuntimeAssembly'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const predefined = new AZPredefinedSymbols(symbols)
const workingMemory = new AZWorkingMemory()

const s1 = symbols.makeIdentifier('S')
const o2 = symbols.makeIdentifier('O')

const name = symbols.makeStringConstant('name')
const one = symbols.makeStringConstant('one')
const phase = symbols.makeStringConstant('phase')
const oldPhase = symbols.makeStringConstant('old')
const newPhase = symbols.makeStringConstant('new')

const goalStateResolver = {
  isGoal(symbol: typeof s1): boolean {
    return symbol === s1
  },

  getLevel(symbol: typeof s1): number {
    if (symbol !== s1) {
      throw new Error('Symbol is not the test goal')
    }

    return 1
  },
}

const runtime =
  new AZProductionRuntimeAssembly(
    workingMemory,
    goalStateResolver,
    predefined.operator,
  )

/*
 * The grounds exist BEFORE the justification is installed.
 */
const operatorWme =
  workingMemory.createElement(
    s1,
    predefined.operator,
    o2,
    false,
  )

const nameWme =
  workingMemory.createElement(
    o2,
    name,
    one,
    false,
  )

workingMemory.scheduleAdd(operatorWme)
workingMemory.scheduleAdd(nameWme)
workingMemory.applyBufferedChanges()

const sourceInstantiation: AZInstantiation = {
  id: 1,
  production: null,
  instantiatedConditions: [],
  matchGoal: s1,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

function result(
  type: AZPreference['type'],
  value: typeof oldPhase,
): AZPreference {
  return {
    type,
    identifier: s1,
    attribute: phase,
    value,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: true,
    inTemporaryMemory: true,
    slot: null,
    instantiation: sourceInstantiation,
  }
}

const justification =
  new AZJustificationMaterializer()
    .materialize(
      'az-justify-dynamic-match',
      [
        operatorWme,
        nameWme,
      ],
      [
        result('REJECT', oldPhase),
        result('ACCEPTABLE', newPhase),
      ],
    )

assert.equal(
  runtime.matchSet.hasPendingChanges(),
  false,
  'No match-set change should exist before justification installation.',
)

const installation =
  runtime.productionInstaller.install(
    justification,
  )

assert.equal(
  installation,
  'NO_REFRACTED_INSTANTIATION',
)

assert.ok(
  justification.productionNode,
  'Justification must be installed in the AZ RETE.',
)

const hasImmediateAssertion =
  runtime.matchSet.hasAssertion('O_ASSERTION', s1) ||
  runtime.matchSet.hasAssertion('I_ASSERTION', s1)

assert.equal(
  hasImmediateAssertion,
  true,
  'A dynamically installed justification must immediately match existing grounds.',
)

console.log('AZ dynamic justification RETE match: OK')
