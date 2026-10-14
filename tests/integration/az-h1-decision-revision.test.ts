import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const runtime = new AZCognitiveRuntimeAssembly()
const symbols = runtime.symbolManager
const top = new AZTopContextCreator(
  symbols,
  runtime.predefinedSymbols,
  runtime.workingMemory,
  runtime.contextStack,
  runtime.stateStack,
  runtime.decisionRuntime.goalContextInitializer,
  runtime.structuralRegistry,
).create()
const goal = top.goal
const situation = symbols.makeStringConstant('h1-situation')
const a = symbols.makeStringConstant('A')
const b = symbols.makeStringConstant('B')
const o1 = symbols.makeIdentifier('O')
const o2 = symbols.makeIdentifier('O')
const state = symbols.makeVariable('<h1-state>')

const eq = (symbol: AZSymbol): AZProductionTest => ({
  type: 'EQUALITY', referent: symbol,
})

function proposal(name: string, stimulus: AZSymbol, operator: AZSymbol): AZProduction {
  return {
    name,
    declaredSupport: 'I_SUPPORT',
    conditions: [{
      type: 'POSITIVE',
      identifierTest: {
        type: 'CONJUNCTIVE',
        conjuncts: [eq(state), { type: 'GOAL_ID' }],
      },
      attributeTest: eq(situation),
      valueTest: eq(stimulus),
      acceptable: false,
    }],
    actions: [{
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: { type: 'SYMBOL', symbol: state },
      attribute: { type: 'SYMBOL', symbol: runtime.predefinedSymbols.operator },
      value: { type: 'SYMBOL', symbol: operator },
      support: 'UNKNOWN',
    }],
    instantiations: [],
  }
}

const p1 = proposal('az-h1-propose-o1', a, o1)
const p2 = proposal('az-h1-propose-o2', b, o2)
for (const p of [p1, p2]) {
  assert.equal(
    runtime.productionRuntime.productionInstaller.install(p),
    'NO_REFRACTED_INSTANTIATION',
  )
}

function installedOperators(): AZSymbol[] {
  return runtime.workingMemory.getElements()
    .filter(w =>
      w.identifier === goal &&
      w.attribute === runtime.predefinedSymbols.operator &&
      w.acceptable === false,
    )
    .map(w => w.value)
}

function runUntilSingleOperator(expected: AZSymbol, maxPhases: number): number {
  for (let step = 1; step <= maxPhases; step += 1) {
    runtime.phaseRuntime.phaseExecutor.executeOnePhase()
    const selected = installedOperators()
    if (selected.length === 1 && selected[0] === expected) return step
  }
  return -1
}

// The initial stimulus is an external fact, not a manually injected preference.
const initial = runtime.workingMemory.createElement(goal, situation, a, false)
runtime.workingMemory.scheduleAdd(initial)
runtime.workingMemory.applyBufferedChanges()

const initialPhases = runUntilSingleOperator(o1, 30)
assert.notEqual(initialPhases, -1, 'H1: O1 must be selected before perturbation')
assert.ok(p1.instantiations.length > 0, 'H1: P1 must have fired')
assert.deepEqual(installedOperators(), [o1])

// Atomic-at-buffer-boundary replacement of the environmental fact.
const replacement = runtime.workingMemory.createElement(goal, situation, b, false)
runtime.workingMemory.scheduleRemove(initial)
runtime.workingMemory.scheduleAdd(replacement)
runtime.workingMemory.applyBufferedChanges()

assert.equal(runtime.workingMemory.getElements().includes(initial), false)
assert.equal(runtime.workingMemory.getElements().includes(replacement), true)

const revisionPhases = runUntilSingleOperator(o2, 30)
assert.notEqual(revisionPhases, -1, 'H1: O2 must replace O1 within 30 phases')
assert.ok(p2.instantiations.length > 0, 'H1: P2 must have fired')
assert.deepEqual(installedOperators(), [o2], 'H1: exactly O2 must remain installed')
assert.equal(top.lower, null, 'H1: no unresolved lower context should remain')

console.log(JSON.stringify({
  experiment: 'AZ-H1',
  verdict: 'PASS',
  initialPhases,
  revisionPhases,
  selected: 'O2',
}))
