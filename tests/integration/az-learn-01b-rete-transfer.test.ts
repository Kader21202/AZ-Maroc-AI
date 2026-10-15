import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZProductionRuntimeAssembly } from '../../src/engines/cognitive/az/core/production/AZProductionRuntimeAssembly'
import { AZJustificationMaterializer } from '../../src/engines/cognitive/az/core/production/AZJustificationMaterializer'
import { AZCausalRuleGeneralizer } from '../../src/engines/cognitive/az/core/learning/AZCausalRuleGeneralizer'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'

function experiment(
  scenario: 'original' | 'transfer' | 'broken' | 'changed',
  generalized: boolean,
): boolean {
  const symbols = new AZSymbolManager()
  const predefined = new AZPredefinedSymbols(symbols)
  const memory = new AZWorkingMemory()

  const s1 = symbols.makeIdentifier('S')
  const o1 = symbols.makeIdentifier('O')

  const name = symbols.makeStringConstant('name')
  const selected = symbols.makeStringConstant('selected')
  const other = symbols.makeStringConstant('other')
  const phase = symbols.makeStringConstant('phase')
  const ready = symbols.makeStringConstant('ready')

  const sourceGrounds = [
    memory.createElement(s1, predefined.operator, o1, false),
    memory.createElement(o1, name, selected, false),
  ]

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

  const result: AZPreference = {
    type: 'ACCEPTABLE',
    identifier: s1,
    attribute: phase,
    value: ready,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: true,
    inTemporaryMemory: true,
    slot: null,
    instantiation: sourceInstantiation,
  }

  const justification =
    new AZJustificationMaterializer().materialize(
      'az-learn-01b-source',
      sourceGrounds,
      [result],
    )

  const production = generalized
    ? new AZCausalRuleGeneralizer(symbols).generalize(
        'az-learn-01b-generalized',
        justification,
      )
    : justification

  const newState = symbols.makeIdentifier('S')
  const newOperator = symbols.makeIdentifier('O')
  const unrelated = symbols.makeIdentifier('O')

  const state = scenario === 'original' ? s1 : newState
  const operator = scenario === 'original' ? o1 : newOperator

  const observed = [
    memory.createElement(
      state,
      predefined.operator,
      operator,
      false,
    ),
    memory.createElement(
      scenario === 'broken' ? unrelated : operator,
      name,
      scenario === 'changed' ? other : selected,
      false,
    ),
  ]

  const goalStateResolver = {
    isGoal(symbol: typeof s1): boolean {
      return symbol === state
    },
    getLevel(symbol: typeof s1): number {
      if (symbol !== state) {
        throw new Error('Unknown goal')
      }
      return 1
    },
  }

  const runtime = new AZProductionRuntimeAssembly(
    memory,
    goalStateResolver,
    predefined.operator,
  )

  for (const wme of observed) {
    memory.scheduleAdd(wme)
  }
  memory.applyBufferedChanges()

  assert.equal(
    runtime.productionInstaller.install(production),
    'NO_REFRACTED_INSTANTIATION',
    'Production installation must succeed',
  )

  return (
    runtime.matchSet.hasAssertion('O_ASSERTION', state) ||
    runtime.matchSet.hasAssertion('I_ASSERTION', state)
  )
}

assert.equal(experiment('original', false), true)
assert.equal(experiment('transfer', false), false)

assert.equal(experiment('original', true), true)
assert.equal(experiment('transfer', true), true)
assert.equal(experiment('broken', true), false)
assert.equal(experiment('changed', true), false)

console.log('AZ LEARN 01B RETE transfer and counterexamples: OK')
