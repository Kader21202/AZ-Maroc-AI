import assert from 'node:assert/strict'
import type { AZBufferedLinkChangesProcessor } from '../../src/engines/cognitive/az/core/decision/AZBufferedLinkChangesProcessor'
import { AZDecisionRuntimeAssembly } from '../../src/engines/cognitive/az/core/decision/AZDecisionRuntimeAssembly'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZContextChangeTracker } from '../../src/engines/cognitive/az/core/state/AZContextChangeTracker'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZDefaultImpasseStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(symbols)

const preferenceMemory =
  new AZPreferenceMemory()

const workingMemory =
  new AZWorkingMemory()

const matchSet =
  new AZMatchSet()

const contextStack =
  new AZGoalContextStack()
const stateStack = new AZStateStack()

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const goalIdentityRegistry =
  new AZDefaultGoalIdentityRegistry()

const contextChangeTracker =
  new AZContextChangeTracker(
    goalStateRegistry,
  )

const identifierStateRegistry =
  new AZDefaultIdentifierLinkStateRegistry()

const structuralRegistry =
  new AZDefaultGoalStructuralStateRegistry()

const impasseRegistry =
  new AZDefaultImpasseStateRegistry()

const decisionRuntime =
  new AZDecisionRuntimeAssembly({
    symbolManager: symbols,
    predefinedSymbols,
    preferenceMemory,
    workingMemory,
    matchSet,
    contextStack,
    stateStack,
    contextChangeTracker,
    goalStateRegistry,
    goalIdentityRegistry,
    identifierStateRegistry,
    structuralRegistry,
    impasseRegistry,
    bufferedLinkChangesProcessor: {
      process(): void {},
    } as AZBufferedLinkChangesProcessor,
  })

const topContextCreator =
  new AZTopContextCreator(
    symbols,
    predefinedSymbols,
    workingMemory,
    contextStack,
    stateStack,
    decisionRuntime.goalContextInitializer,
    structuralRegistry,
  )

const top =
  topContextCreator.create()

const goal = top.goal

const operatorSlot =
  structuralRegistry.get(goal).operatorSlot

if (operatorSlot === null) {
  throw new Error(
    'Top context must expose an operator slot',
  )
}

const lower =
  decisionRuntime.lowerContextCreator.create(
    top,
    predefinedSymbols.operator,
    'NO_CHANGE',
  )

workingMemory.applyBufferedChanges()

const oldOperator =
  symbols.makeIdentifier('O')

const oldWme =
  workingMemory.createElement(
    goal,
    predefinedSymbols.operator,
    oldOperator,
  )

workingMemory.scheduleAdd(oldWme)
workingMemory.applyBufferedChanges()

operatorSlot.wmes.push(oldWme)

/*
 * Preferences now select another operator.
 * The installed decision must therefore become
 * inconsistent.
 */
const newOperator =
  symbols.makeIdentifier('O')

const generatedPreferences:
  AZPreference[] = []

const instantiation:
  AZInstantiation = {
    id: 1,
    production: null,
    instantiatedConditions: [],
    matchGoal: goal,
    matchGoalLevel: 1,
    inMatchSet: true,
    generatedPreferences,
    reteToken: null,
    reteWme: null,
  }

const preference:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: goal,
    attribute:
      predefinedSymbols.operator,
    value: newOperator,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation,
  }

generatedPreferences.push(
  preference,
)

preferenceMemory.add(
  preference,
)

assert.equal(
  operatorSlot.changed,
  true,
)

assert.equal(
  operatorSlot.wmes[0],
  oldWme,
)

let applyCalls = 0
const originalApply =
  decisionRuntime.workingMemoryChangesApplier.apply.bind(
    decisionRuntime.workingMemoryChangesApplier,
  )
decisionRuntime.workingMemoryChangesApplier.apply = (
  memory,
  wm,
) => {
  applyCalls += 1
  originalApply(memory, wm)
}

contextChangeTracker.markGoalAsContextChanged(goal)

const invalidated =
  decisionRuntime
    .consistencyProcessor
    .process()

assert.equal(
  invalidated,
  true,
  'changed preferences must invalidate the installed operator',
)

assert.equal(
  operatorSlot.wmes.length,
  0,
  'inconsistent current operator WME must be removed',
)

assert.equal(
  workingMemory
    .getElements()
    .includes(oldWme),
  false,
  'removed operator must leave working memory',
)

assert.equal(
  top.lower,
  null,
  'inconsistent lower context must be removed',
)

assert.equal(
  contextStack.bottom,
  top,
  'top must become the bottom goal context after lower removal',
)

assert.equal(
  contextStack.findByGoal(lower.goal),
  null,
  'removed lower goal must leave the context stack',
)

assert.equal(
  stateStack.bottom?.goal,
  goal,
  'top goal must become the bottom state after lower removal',
)

assert.equal(
  stateStack.findByGoal(lower.goal),
  null,
  'removed lower goal must leave the state stack',
)

assert.equal(
  operatorSlot.changed,
  true,
  'consistency processing must not consume the changed-slot state',
)

assert.equal(
  contextChangeTracker.highestGoalWhoseContextChanged,
  goal,
  'consistency processing must not consume context-change tracking',
)

assert.equal(
  applyCalls,
  1,
  'invalidation must apply working-memory changes exactly once',
)

contextChangeTracker.clear()

const secondInvalidation =
  decisionRuntime.consistencyProcessor.process()

assert.equal(
  secondInvalidation,
  false,
  'a second pass must not invalidate anything',
)

assert.equal(
  applyCalls,
  1,
  'a non-invalidating second pass must not reapply working-memory changes',
)

console.log(
  'AZ context decision consistency invalidation: OK',
)
