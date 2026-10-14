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
const i5 = symbols.makeIdentifier('I')
const goalStateResolver: AZGoalStateResolver = {
  isGoal(candidate): boolean { return candidate === s4 },
  getLevel(candidate): number {
    if (candidate === s4) return 2
    throw new Error('Symbol is not a test goal')
  },
}
const runtime = new AZProductionRuntimeAssembly(workingMemory, goalStateResolver, predefined.operator)
const s = symbols.makeVariable('<s>')
const op = symbols.makeVariable('<op>')
const name = symbols.makeStringConstant('name')
const init = symbols.makeStringConstant('init')
const production: AZProduction = {
  name: 'apply*init-minimal-late-operator',
  declaredSupport: 'O_SUPPORT',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: { type: 'CONJUNCTIVE', conjuncts: [{ type: 'EQUALITY', referent: s }, { type: 'GOAL_ID' }] },
      attributeTest: { type: 'EQUALITY', referent: predefined.operator },
      valueTest: { type: 'EQUALITY', referent: op },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: { type: 'EQUALITY', referent: op },
      attributeTest: { type: 'EQUALITY', referent: name },
      valueTest: { type: 'EQUALITY', referent: init },
      acceptable: false,
    },
  ],
  actions: [],
  instantiations: [],
}
assert.equal(runtime.productionInstaller.install(production), 'NO_REFRACTED_INSTANTIATION')
const operatorName = workingMemory.createElement(i5, name, init)
workingMemory.scheduleAdd(operatorName)
workingMemory.applyBufferedChanges()
assert.equal(runtime.matchSet.hasAssertion('O_ASSERTION', s4), false, 'operator name alone must not match apply*init')
const selectedOperator = workingMemory.createElement(s4, predefined.operator, i5, false)
workingMemory.scheduleAdd(selectedOperator)
workingMemory.applyBufferedChanges()
assert.equal(runtime.matchSet.hasAssertion('O_ASSERTION', s4), true, 'late selected operator WME must relink apply*init and create an assertion')
workingMemory.scheduleRemove(selectedOperator)
workingMemory.scheduleRemove(operatorName)
workingMemory.applyBufferedChanges()

assert.equal(
  runtime.matchSet.hasAssertion('O_ASSERTION', s4),
  false,
  'removing the matched pair must retract the assertion',
)

const installedProduction =
  runtime.proceduralMemory.findByName(
    'apply*init-minimal-late-operator',
  )

assert.notEqual(
  installedProduction,
  undefined,
  'installed production must remain available',
)

let reteNode: any =
  installedProduction!.productionNode

while (reteNode !== null) {
  if (
    (reteNode.type === 'POSITIVE' ||
      reteNode.type === 'UNHASHED_POSITIVE') &&
    reteNode.leftUnlinked === true &&
    reteNode.rightUnlinked === true
  ) {
    assert.fail(
      'AZ invariant violated: a positive RETE node must not remain simultaneously left-unlinked and right-unlinked',
    )
  }

  reteNode = reteNode.parent ?? null
}

const i6 = symbols.makeIdentifier('I')
const replacementName =
  workingMemory.createElement(i6, name, init)

workingMemory.scheduleAdd(replacementName)
workingMemory.applyBufferedChanges()

assert.equal(
  runtime.matchSet.hasAssertion('O_ASSERTION', s4),
  false,
  'replacement operator name alone must not match',
)

const replacementOperator =
  workingMemory.createElement(
    s4,
    predefined.operator,
    i6,
    false,
  )

workingMemory.scheduleAdd(replacementOperator)
workingMemory.applyBufferedChanges()

assert.equal(
  runtime.matchSet.hasAssertion('O_ASSERTION', s4),
  true,
  'RETE must rematch after prior match removal and late replacement operator',
)

console.log('AZ RETE historical late operator relink: OK')
