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
const situation = symbols.makeStringConstant('h2-situation')
const a = symbols.makeStringConstant('A')
const b = symbols.makeStringConstant('B')
const o1 = symbols.makeIdentifier('O')
const o2 = symbols.makeIdentifier('O')
const state = symbols.makeVariable('<h2-state>')

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

const p1 = proposal('az-h2-propose-o1', a, o1)
const p2 = proposal('az-h2-propose-o2', b, o2)
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

function runUntilSingleOperator(expected: AZSymbol, maxPhases: number, label: string): number {
  for (let step = 1; step <= maxPhases; step += 1) {
    runtime.phaseRuntime.phaseExecutor.executeOnePhase()
    const selected = installedOperators()
    assert.ok(selected.length <= 1, `${label}: multiple installed operators at phase ${step}`)
    if (selected.length === 1 && selected[0] === expected) return step
  }
  return -1
}

// All environment changes are made through WME buffering; no preferences or
// decisions are injected directly into the cognitive runtime.
let current = runtime.workingMemory.createElement(goal, situation, a, false)
runtime.workingMemory.scheduleAdd(current)
runtime.workingMemory.applyBufferedChanges()

const initialPhases = runUntilSingleOperator(o1, 30, 'initial A')
assert.notEqual(initialPhases, -1, 'H2: O1 must be selected initially')
assert.ok(p1.instantiations.length > 0, 'H2: P1 must have fired')
assert.deepEqual(installedOperators(), [o1])

const revisions: number[] = []
const sequence = [
  { stimulus: b, expected: o2, producer: p2, label: 'A to B' },
  { stimulus: a, expected: o1, producer: p1, label: 'B to A' },
  { stimulus: b, expected: o2, producer: p2, label: 'A to B again' },
]

for (const change of sequence) {
  const next = runtime.workingMemory.createElement(goal, situation, change.stimulus, false)
  runtime.workingMemory.scheduleRemove(current)
  runtime.workingMemory.scheduleAdd(next)
  runtime.workingMemory.applyBufferedChanges()

  const environment = runtime.workingMemory.getElements()
    .filter(w => w.identifier === goal && w.attribute === situation && !w.acceptable)
  assert.equal(environment.length, 1, `${change.label}: exactly one environmental fact`)
  assert.equal(environment[0], next, `${change.label}: new fact must replace old fact`)
  assert.equal(runtime.workingMemory.getElements().includes(current), false)

  const phases = runUntilSingleOperator(change.expected, 30, change.label)
  assert.notEqual(phases, -1, `H2: ${change.label} did not revise within 30 phases`)
  assert.ok(change.producer.instantiations.length > 0, `${change.label}: producer never fired`)
  assert.deepEqual(installedOperators(), [change.expected])
  assert.equal(top.lower, null, `${change.label}: unresolved lower context`)
  revisions.push(phases)
  current = next
}

console.log(JSON.stringify({
  experiment: 'AZ-H2',
  verdict: 'PASS',
  initialPhases,
  revisionPhases: revisions,
  finalSelected: 'O2',
  checks: 'three reversals; no simultaneous installed operators; environment and context consistency',
}))
