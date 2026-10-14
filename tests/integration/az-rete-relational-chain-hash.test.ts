import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZGoalStateResolver } from '../../src/engines/cognitive/az/core/production/AZGoalStateResolver'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import { AZProductionRuntimeAssembly } from '../../src/engines/cognitive/az/core/production/AZProductionRuntimeAssembly'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const predefined = new AZPredefinedSymbols(symbols)
const workingMemory = new AZWorkingMemory()

const s4 = symbols.makeIdentifier('S')
const s1 = symbols.makeIdentifier('S')
const i3 = symbols.makeIdentifier('I')

const goalStateResolver: AZGoalStateResolver = {
  isGoal(candidate): boolean {
    return candidate === s4 || candidate === s1
  },

  getLevel(candidate): number {
    if (candidate === s1) return 1
    if (candidate === s4) return 2

    throw new Error('Symbol is not a test goal')
  },
}

const runtime = new AZProductionRuntimeAssembly(
  workingMemory,
  goalStateResolver,
  predefined.operator,
)

const s = symbols.makeVariable('<s>')
const ss = symbols.makeVariable('<ss>')
const op = symbols.makeVariable('<op>')
const n = symbols.makeVariable('<name>')

const superstate =
  symbols.makeStringConstant('superstate')

const name =
  symbols.makeStringConstant('name')

const production: AZProduction = {
  name: 'az-rete-relational-chain-hash',
  declaredSupport: 'O_SUPPORT',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'CONJUNCTIVE',
        conjuncts: [
          {
            type: 'EQUALITY',
            referent: s,
          },
          {
            type: 'GOAL_ID',
          },
        ],
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: superstate,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: ss,
      },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: ss,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: predefined.operator,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: op,
      },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: op,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: name,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: n,
      },
      acceptable: false,
    },
  ],
  actions: [],
  instantiations: [],
}

assert.equal(
  runtime.productionInstaller.install(production),
  'NO_REFRACTED_INSTANTIATION',
)

for (const element of [
  workingMemory.createElement(
    s1,
    predefined.operator,
    i3,
  ),
  workingMemory.createElement(
    i3,
    name,
    symbols.makeStringConstant('one'),
  ),
]) {
  workingMemory.scheduleAdd(element)
}

workingMemory.applyBufferedChanges()

assert.equal(
  runtime.matchSet.hasAssertion(
    'O_ASSERTION',
    s4,
  ),
  false,
  'chain must not match before lower goal WME exists',
)

const lowerGoalSuperstate =
  workingMemory.createElement(
    s4,
    superstate,
    s1,
  )

workingMemory.scheduleAdd(lowerGoalSuperstate)
workingMemory.applyBufferedChanges()

assert.equal(
  runtime.matchSet.hasAssertion(
    'O_ASSERTION',
    s4,
  ),
  true,
  'late lower-goal superstate WME must complete relational chain',
)
console.log(
  'AZ RETE relational chain hash: OK',
)
