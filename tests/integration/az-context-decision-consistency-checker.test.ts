import assert from 'node:assert/strict'
import { AZDefaultContextPreferenceSemantics } from '../../src/engines/cognitive/az/core/decision/AZDefaultContextPreferenceSemantics'
import { AZContextDecisionConsistencyChecker } from '../../src/engines/cognitive/az/core/decision/AZContextDecisionConsistencyChecker'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'

function build() {
  const symbols = new AZSymbolManager()
  const predefined = new AZPredefinedSymbols(symbols)
  const memory = new AZPreferenceMemory()
  const structural = new AZDefaultGoalStructuralStateRegistry()
  const stack = new AZGoalContextStack()
  const goal = symbols.makeIdentifier('S')
  const context = stack.setTop(goal)
  const slot = memory.getOrCreateContextSlot(goal, predefined.operator)

  structural.register(goal, { operatorSlot: slot })

  const checker = new AZContextDecisionConsistencyChecker(
    new AZDefaultContextPreferenceSemantics(),
    structural,
  )

  let nextId = 1

  function addPreference(type: AZPreference['type'], value: ReturnType<AZSymbolManager['makeIdentifier']>) {
    const generatedPreferences: AZPreference[] = []
    const instantiation: AZInstantiation = {
      id: nextId++,
      production: null,
      instantiatedConditions: [],
      matchGoal: goal,
      matchGoalLevel: 1,
      inMatchSet: true,
      generatedPreferences,
      reteToken: null,
      reteWme: null,
    }

    const preference: AZPreference = {
      type,
      identifier: goal,
      attribute: predefined.operator,
      value,
      referent: null,
      level: 1,
      numericValue: 0,
      oSupported: false,
      inTemporaryMemory: false,
      slot: null,
      instantiation,
    }

    generatedPreferences.push(preference)
    memory.add(preference)
    return preference
  }

  return { symbols, predefined, memory, structural, stack, goal, context, slot, checker, addPreference }
}

/* No installed decision and no lower context. */
{
  const r = build()
  assert.equal(r.checker.check(r.context, r.slot), 'NO_CURRENT_DECISION')
}

/* An unchanged installed decision is consistent. */
{
  const r = build()
  const operator = r.symbols.makeIdentifier('O')
  r.slot.wmes.push({ value: operator } as typeof r.slot.wmes[number])
  r.slot.changed = false
  assert.equal(r.checker.check(r.context, r.slot), 'CONSISTENT')
}

/* Changed preferences still select the installed operator. */
{
  const r = build()
  const operator = r.symbols.makeIdentifier('O')
  r.slot.wmes.push({ value: operator } as typeof r.slot.wmes[number])
  r.addPreference('REQUIRE', operator)
  assert.equal(r.checker.check(r.context, r.slot), 'CONSISTENT')
}

/* Changed preferences select another operator. */
{
  const r = build()
  const installed = r.symbols.makeIdentifier('O')
  const replacement = r.symbols.makeIdentifier('O')
  r.slot.wmes.push({ value: installed } as typeof r.slot.wmes[number])
  r.addPreference('REQUIRE', replacement)
  assert.equal(r.checker.check(r.context, r.slot), 'INCONSISTENT')
}

/* Existing TIE remains consistent when semantics still produce a TIE. */
{
  const r = build()
  const o1 = r.symbols.makeIdentifier('O')
  const o2 = r.symbols.makeIdentifier('O')
  const lowerGoal = r.symbols.makeIdentifier('S')
  const lower = r.stack.appendLower(r.context, lowerGoal)

  r.structural.register(lowerGoal, {
    impasseType: 'TIE',
  })

  r.addPreference('ACCEPTABLE', o1)
  r.addPreference('ACCEPTABLE', o2)

  assert.equal(r.context.lower, lower)
  assert.equal(r.checker.check(r.context, r.slot), 'CONSISTENT')
}

/* Operator NO_CHANGE is compared as an installed NONE decision. */
{
  const r = build()
  const operator = r.symbols.makeIdentifier('O')
  const lowerGoal = r.symbols.makeIdentifier('S')

  r.slot.wmes.push({ value: operator } as typeof r.slot.wmes[number])
  r.stack.appendLower(r.context, lowerGoal)
  r.structural.register(lowerGoal, { impasseType: 'NO_CHANGE' })
  r.addPreference('REQUIRE', operator)

  assert.equal(r.checker.check(r.context, r.slot), 'CONSISTENT')
}

/* NO_CHANGE without the installed operator is inconsistent with NONE. */
{
  const r = build()
  const operator = r.symbols.makeIdentifier('O')
  const lowerGoal = r.symbols.makeIdentifier('S')

  r.stack.appendLower(r.context, lowerGoal)
  r.structural.register(lowerGoal, { impasseType: 'NO_CHANGE' })
  r.addPreference('REQUIRE', operator)

  assert.equal(r.checker.check(r.context, r.slot), 'INCONSISTENT')
}

/* Checker rejects a non-context slot. */
{
  const r = build()
  const slot = {
    ...r.slot,
    wmes: [],
    isaContextSlot: false,
  }

  assert.throws(
    () => r.checker.check(r.context, slot),
    /requires a context slot/,
  )
}

console.log('AZ context decision consistency checker: OK')
