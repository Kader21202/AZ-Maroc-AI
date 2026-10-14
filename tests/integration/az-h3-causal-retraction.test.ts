import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'

const runtime = new AZCognitiveRuntimeAssembly()
const symbols = runtime.symbolManager
const top = new AZTopContextCreator(
  symbols, runtime.predefinedSymbols, runtime.workingMemory,
  runtime.contextStack, runtime.stateStack,
  runtime.decisionRuntime.goalContextInitializer, runtime.structuralRegistry,
).create()
const goal = top.goal
const situation = symbols.makeStringConstant('h3-situation')
const a = symbols.makeStringConstant('A')
const b = symbols.makeStringConstant('B')
const o1 = symbols.makeIdentifier('O')
const o2 = symbols.makeIdentifier('O')
const state = symbols.makeVariable('<h3-state>')
const eq = (symbol: AZSymbol): AZProductionTest => ({ type: 'EQUALITY', referent: symbol })

function proposal(name: string, stimulus: AZSymbol, operator: AZSymbol): AZProduction {
  return {
    name, declaredSupport: 'I_SUPPORT',
    conditions: [{
      type: 'POSITIVE',
      identifierTest: { type: 'CONJUNCTIVE', conjuncts: [eq(state), { type: 'GOAL_ID' }] },
      attributeTest: eq(situation), valueTest: eq(stimulus), acceptable: false,
    }],
    actions: [{
      type: 'MAKE', preferenceType: 'ACCEPTABLE',
      identifier: { type: 'SYMBOL', symbol: state },
      attribute: { type: 'SYMBOL', symbol: runtime.predefinedSymbols.operator },
      value: { type: 'SYMBOL', symbol: operator }, support: 'UNKNOWN',
    }],
    instantiations: [],
  }
}

const p1 = proposal('az-h3-propose-o1', a, o1)
const p2 = proposal('az-h3-propose-o2', b, o2)
for (const production of [p1, p2]) {
  assert.equal(runtime.productionRuntime.productionInstaller.install(production), 'NO_REFRACTED_INSTANTIATION')
}

function installedOperators(): AZSymbol[] {
  return runtime.workingMemory.getElements()
    .filter(w => w.identifier === goal && w.attribute === runtime.predefinedSymbols.operator && !w.acceptable)
    .map(w => w.value)
}

function verifyPreferenceOrigin(instantiation: AZInstantiation, production: AZProduction, label: string): void {
  assert.equal(instantiation.production, production, `${label}: wrong originating production`)
  const acceptable = instantiation.generatedPreferences.filter(pref =>
    pref.type === 'ACCEPTABLE' && pref.identifier === goal &&
    pref.attribute === runtime.predefinedSymbols.operator,
  )
  assert.ok(acceptable.length > 0, `${label}: no operator ACCEPTABLE preference produced`)
  for (const pref of acceptable) {
    assert.equal(pref.instantiation, instantiation, `${label}: broken preference-to-instantiation link`)
    assert.equal(pref.inTemporaryMemory, true, `${label}: expected preference not active`)
    assert.notEqual(pref.slot, null, `${label}: active preference missing slot`)
    assert.equal(pref.slot?.allPreferences.includes(pref), true, `${label}: missing from slot`)
  }
}

function verifyRetracted(instantiation: AZInstantiation, label: string): void {
  assert.equal(instantiation.inMatchSet, false, `${label}: retracted instantiation remains in match set`)
  for (const pref of instantiation.generatedPreferences) {
    if (pref.oSupported) continue // O-supported preferences have a different lifetime.
    assert.equal(pref.inTemporaryMemory, false, `${label}: obsolete I-supported preference still active`)
    assert.equal(pref.slot, null, `${label}: obsolete preference still linked to slot`)
  }
}

function runUntil(expected: AZSymbol, label: string): { phases: number; retracted: AZInstantiation[] } {
  const retracted: AZInstantiation[] = []
  for (let phase = 1; phase <= 30; phase++) {
    const result = runtime.phaseRuntime.phaseExecutor.executeOnePhase()
    retracted.push(...(result.elaboration?.waterfall.retractedInstantiations ?? []))
    const selected = installedOperators()
    assert.ok(selected.length <= 1, `${label}: simultaneous installed operators at phase ${phase}`)
    if (selected.length === 1 && selected[0] === expected) {
      assert.equal(top.lower, null, `${label}: unresolved lower context`)
      return { phases: phase, retracted }
    }
  }
  assert.fail(`${label}: expected operator not installed within 30 phases`)
}

let current = runtime.workingMemory.createElement(goal, situation, a, false)
runtime.workingMemory.scheduleAdd(current)
runtime.workingMemory.applyBufferedChanges()
const initial = runUntil(o1, 'initial A')
assert.ok(p1.instantiations.length > 0, 'initial A: P1 never fired')
verifyPreferenceOrigin(p1.instantiations[0], p1, 'initial A')

const revisions: number[] = []
const retractionCounts: number[] = []
for (const change of [
  { stimulus: b, expected: o2, previous: p1, next: p2, label: 'A to B' },
  { stimulus: a, expected: o1, previous: p2, next: p1, label: 'B to A' },
  { stimulus: b, expected: o2, previous: p1, next: p2, label: 'A to B again' },
]) {
  const prior = [...change.previous.instantiations]
  assert.ok(prior.length > 0, `${change.label}: previous production has no instantiation`)
  const next = runtime.workingMemory.createElement(goal, situation, change.stimulus, false)
  runtime.workingMemory.scheduleRemove(current)
  runtime.workingMemory.scheduleAdd(next)
  runtime.workingMemory.applyBufferedChanges()
  const facts = runtime.workingMemory.getElements().filter(w =>
    w.identifier === goal && w.attribute === situation && !w.acceptable,
  )
  assert.deepEqual(facts, [next], `${change.label}: environmental replacement failed`)
  const outcome = runUntil(change.expected, change.label)
  assert.ok(change.next.instantiations.length > 0, `${change.label}: new production never fired`)
  verifyPreferenceOrigin(change.next.instantiations[0], change.next, change.label)
  for (const old of prior) {
    assert.ok(outcome.retracted.includes(old), `${change.label}: old instantiation absent from retraction trace`)
    verifyRetracted(old, change.label)
  }
  assert.equal(change.previous.instantiations.length, 0, `${change.label}: obsolete instantiation remains on production`)
  assert.deepEqual(installedOperators(), [change.expected], `${change.label}: final operator mismatch`)
  revisions.push(outcome.phases)
  retractionCounts.push(outcome.retracted.length)
  current = next
}

console.log(JSON.stringify({
  experiment: 'AZ-H3', verdict: 'PASS', initialPhases: initial.phases,
  revisionPhases: revisions, retractionCounts,
  checks: 'retraction trace; inactive obsolete I-support; active new preferences; preference instantiation provenance',
}))
