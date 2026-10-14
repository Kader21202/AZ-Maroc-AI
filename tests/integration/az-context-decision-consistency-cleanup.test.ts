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
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZDefaultImpasseStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const predefinedSymbols = new AZPredefinedSymbols(symbols)
const preferenceMemory = new AZPreferenceMemory()
const workingMemory = new AZWorkingMemory()
const matchSet = new AZMatchSet()
const contextStack = new AZGoalContextStack()
const stateStack = new AZStateStack()
const goalStateRegistry = new AZDefaultGoalStateRegistry()
const goalIdentityRegistry = new AZDefaultGoalIdentityRegistry()
const contextChangeTracker =
  new AZContextChangeTracker(
    goalStateRegistry,
  )

const identifierStateRegistry =
  new AZDefaultIdentifierLinkStateRegistry()
const structuralRegistry = new AZDefaultGoalStructuralStateRegistry()
const impasseRegistry = new AZDefaultImpasseStateRegistry()

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

const topGoal = symbols.makeIdentifier('S')
const lowerGoal = symbols.makeIdentifier('S')

const topContext =
  contextStack.setTop(topGoal)

contextStack.appendLower(
  topContext,
  lowerGoal,
)

goalStateRegistry.registerGoal(
  topGoal,
  1,
)

goalStateRegistry.registerGoal(
  lowerGoal,
  2,
)

structuralRegistry.register(
  topGoal,
)

structuralRegistry.register(
  lowerGoal,
  {
    impasseType: 'NO_CHANGE',
  },
)

impasseRegistry.registerImpasse(
  lowerGoal,
)

const operatorSlot =
  preferenceMemory.getOrCreateContextSlot(
    topGoal,
    predefinedSymbols.operator,
  )

structuralRegistry.get(
  topGoal,
).operatorSlot = operatorSlot

const oldOperator =
  symbols.makeIdentifier('O')

const oldWme =
  workingMemory.createElement(
    topGoal,
    predefinedSymbols.operator,
    oldOperator,
  )

workingMemory.scheduleAdd(
  oldWme,
)

workingMemory.applyBufferedChanges()

operatorSlot.wmes.push(
  oldWme,
)

const newOperator =
  symbols.makeIdentifier('O')

const generatedPreferences:
  AZPreference[] = []

const instantiation:
  AZInstantiation = {
    id: 1,
    production: null,
    instantiatedConditions: [],
    matchGoal: topGoal,
    matchGoalLevel: 1,
    inMatchSet: true,
    generatedPreferences,
    reteToken: null,
    reteWme: null,
  }

const preference:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: topGoal,
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

const invalidated =
  decisionRuntime
    .consistencyProcessor
    .process()

assert.equal(
  invalidated,
  true,
)

assert.equal(
  topContext.lower,
  null,
  'lower context must be removed after decision invalidation',
)

assert.equal(
  contextStack.bottom,
  topContext,
)

assert.equal(
  structuralRegistry.has(
    lowerGoal,
  ),
  false,
  'lower structural state must be removed',
)

assert.equal(
  goalStateRegistry.isGoal(
    lowerGoal,
  ),
  false,
  'lower goal state must be removed',
)

assert.equal(
  impasseRegistry.isImpasse(
    lowerGoal,
  ),
  false,
  'lower impasse state must be removed',
)

console.log(
  'AZ context decision consistency lower-context cleanup: OK',
)
