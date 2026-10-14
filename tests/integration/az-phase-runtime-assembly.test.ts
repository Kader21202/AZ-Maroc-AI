import assert from 'node:assert/strict'
import { AZElaborationRuntimeAssembly } from '../../src/engines/cognitive/az/core/cycle/AZElaborationRuntimeAssembly'
import { AZPhaseRuntimeAssembly } from '../../src/engines/cognitive/az/core/cycle/AZPhaseRuntimeAssembly'
import { AZBufferedLinkChangesProcessor } from '../../src/engines/cognitive/az/core/decision/AZBufferedLinkChangesProcessor'
import { AZDecisionRuntimeAssembly } from '../../src/engines/cognitive/az/core/decision/AZDecisionRuntimeAssembly'
import type { AZIdentifierDemotionProcessor } from '../../src/engines/cognitive/az/core/decision/AZIdentifierDemotionProcessor'
import type { AZIdentifierPromotionBufferProcessor } from '../../src/engines/cognitive/az/core/decision/AZIdentifierPromotionBufferProcessor'
import type { AZLinkAdditionProcessor } from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import type { AZLinkRemovalProcessor } from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZContextChangeTracker } from '../../src/engines/cognitive/az/core/state/AZContextChangeTracker'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZDefaultImpasseStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(symbols)

const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()

const preferenceMemory =
  new AZPreferenceMemory()

const workingMemory =
  new AZWorkingMemory()

const matchSet =
  new AZMatchSet()

const stateStack =
  new AZStateStack()

const contextStack =
  new AZGoalContextStack()

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const goalIdentityRegistry =
  new AZDefaultGoalIdentityRegistry()

const contextChangeTracker =
  new AZContextChangeTracker(
    goalStateRegistry,
  )

const structuralRegistry =
  new AZDefaultGoalStructuralStateRegistry()

const impasseRegistry =
  new AZDefaultImpasseStateRegistry()


const linkAdditions = {
  post(): void {},
  hasPendingPromotions(): boolean {
    return false
  },
  takeNextPromotedIdentifier() {
    return null
  },
} as AZLinkAdditionProcessor

const linkRemovals = {
  setLinkUpdateMode(): void {},
  post(): void {},
  addUnknownLevelIdentifier(): void {},
  removeUnknownLevelIdentifier(): boolean {
    return false
  },
  getUnknownLevelIdentifiers() {
    return []
  },
  getDisconnectedIdentifiers() {
    return []
  },
  moveUnknownLevelIdentifierToDisconnected(): void {},
  takeNextUnknownLevelIdentifier() {
    return null
  },
  takeNextDisconnectedIdentifier() {
    return null
  },
} as AZLinkRemovalProcessor

const bufferedLinkChanges =
  new AZBufferedLinkChangesProcessor(
    linkAdditions,
    linkRemovals,
    {
      processAll(): void {},
    } as AZIdentifierPromotionBufferProcessor,
    {
      process(): void {},
    } as AZIdentifierDemotionProcessor,
  )

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
    identifierStateRegistry:
      identifierStates,
    structuralRegistry,
    impasseRegistry,
    bufferedLinkChangesProcessor:
      bufferedLinkChanges,
  })

const elaborationRuntime =
  new AZElaborationRuntimeAssembly({
    symbolManager: symbols,
    identifierStateRegistry:
      identifierStates,
    preferenceMemory,
    workingMemory,
    nonContextSlotsDecider:
      decisionRuntime.nonContextSlotsDecider,
    bufferedLinkChangesProcessor:
      bufferedLinkChanges,
  })

const calls: string[] = []


const phaseRuntime =
  new AZPhaseRuntimeAssembly({
    elaborationRuntime,
    matchSet,
    stateStack,
    identifierStateRegistry:
      identifierStates,
    workingMemory,
    decisionRuntime,
    onNormalInputCycle: () => {
      calls.push('INPUT-CYCLE')
    },
  })

const executed: string[] = []

for (let i = 0; i < 2; i += 1) {
  const result =
    phaseRuntime
      .phaseExecutor
      .executeOnePhase()

  executed.push(result.executedPhase)
}

assert.deepEqual(
  executed,
  ['INPUT', 'PROPOSE'],
)

assert.equal(
  phaseRuntime.controller.currentPhase,
  'DECIDE',
)

const identifier =
  symbols.makeIdentifier('I')

const attribute =
  symbols.makeStringConstant('answer')

const value =
  symbols.makeStringConstant('Rabat')

const generatedPreferences:
  AZPreference[] = []

const instantiation:
  AZInstantiation = {
    id: 1,
    production: null,
    instantiatedConditions: [],
    matchGoal: null,
    matchGoalLevel: 0,
    inMatchSet: true,
    generatedPreferences,
    reteToken: null,
    reteWme: null,
  }

const preference: AZPreference = {
  type: 'ACCEPTABLE',
  identifier,
  attribute,
  value,
  referent: null,
  level: 0,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation,
}

generatedPreferences.push(preference)

preferenceMemory.add(preference)

const slotBefore =
  preferenceMemory.getSlot(
    identifier,
    attribute,
  )

assert.notEqual(slotBefore, null)
assert.equal(slotBefore!.wmes.length, 0)

const decideResult =
  phaseRuntime
    .phaseExecutor
    .executeOnePhase()

executed.push(decideResult.executedPhase)

assert.equal(
  decideResult.executedPhase,
  'DECIDE',
)

const slotAfter =
  preferenceMemory.getSlot(
    identifier,
    attribute,
  )

assert.notEqual(slotAfter, null)

assert.equal(
  slotAfter!.wmes.length,
  0,
  'DECIDE must leave non-context slots to the working-memory phase',
)

assert.equal(
  slotAfter!.changed,
  true,
  'DECIDE must not consume a changed non-context slot',
)

for (let i = 0; i < 2; i += 1) {
  const result =
    phaseRuntime
      .phaseExecutor
      .executeOnePhase()

  executed.push(result.executedPhase)
}

assert.equal(
  slotAfter!.wmes.length,
  0,
  'quiescent APPLY must not fabricate a non-context WME',
)

assert.equal(
  slotAfter!.changed,
  true,
  'quiescent APPLY must leave the non-context slot pending',
)

assert.deepEqual(
  executed,
  [
    'INPUT',
    'PROPOSE',
    'DECIDE',
    'APPLY',
    'OUTPUT',
  ],
)

assert.equal(
  phaseRuntime.controller.currentPhase,
  'INPUT',
  'top-level cycle must return to INPUT',
)


console.log(
  'AZ top-level phase runtime with real decision: OK',
)
