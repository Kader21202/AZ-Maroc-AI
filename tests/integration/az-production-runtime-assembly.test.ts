import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZGoalStateResolver } from '../../src/engines/cognitive/az/core/production/AZGoalStateResolver'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import { AZProductionRuntimeAssembly } from '../../src/engines/cognitive/az/core/production/AZProductionRuntimeAssembly'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const predefined =
  new AZPredefinedSymbols(symbols)

const workingMemory =
  new AZWorkingMemory()

const state =
  symbols.makeIdentifier('S')

const goalStateResolver: AZGoalStateResolver = {
  isGoal(candidate): boolean {
    return candidate === state
  },

  getLevel(candidate): number {
    if (candidate !== state) {
      throw new Error(
        'Symbol is not the test goal',
      )
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

const s =
  symbols.makeVariable('<s>')

const x =
  symbols.makeVariable('<x>')

const name =
  symbols.makeStringConstant('name')

const result =
  symbols.makeStringConstant('result')

const production: AZProduction = {
  name: 'az-production-runtime-assembly',
  declaredSupport: 'O_SUPPORT',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: s,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: name,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: x,
      },
      acceptable: false,
    },
  ],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol: s,
      },
      attribute: {
        type: 'SYMBOL',
        symbol: result,
      },
      value: {
        type: 'SYMBOL',
        symbol: x,
      },
      support: 'UNKNOWN',
    },
  ],
  instantiations: [],
}

assert.equal(
  runtime.productionInstaller.install(
    production,
  ),
  'NO_REFRACTED_INSTANTIATION',
)

assert.equal(
  runtime.proceduralMemory.findByName(
    production.name,
  ),
  production,
)

const value =
  symbols.makeStringConstant('value')

const element =
  workingMemory.createElement(
    state,
    name,
    value,
  )

workingMemory.scheduleAdd(element)
workingMemory.applyBufferedChanges()

assert.equal(
  runtime.matchSet.hasAssertion(
    'O_ASSERTION',
    state,
  ),
  true,
)

console.log(
  'AZ production runtime assembly: OK',
)


