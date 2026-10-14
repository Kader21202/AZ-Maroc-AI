import assert from 'node:assert/strict'
import { AZDecisionRuntimeAssembly } from '../../src/engines/cognitive/az/core/decision/AZDecisionRuntimeAssembly'
import type { AZBufferedLinkChangesProcessor } from '../../src/engines/cognitive/az/core/decision/AZBufferedLinkChangesProcessor'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZContextChangeTracker } from '../../src/engines/cognitive/az/core/state/AZContextChangeTracker'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZDefaultImpasseStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbolManager =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(
    symbolManager,
  )

const preferenceMemory =
  new AZPreferenceMemory()

const workingMemory =
  new AZWorkingMemory()

const matchSet =
  new AZMatchSet()

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const goalIdentityRegistry =
  new AZDefaultGoalIdentityRegistry()

const contextChangeTracker =
  new AZContextChangeTracker(
    goalStateRegistry,
  )

const decision =
  new AZDecisionRuntimeAssembly({
    symbolManager,
    predefinedSymbols,
    preferenceMemory,
    workingMemory,
    matchSet,
    contextStack:
      new AZGoalContextStack(),
    stateStack:
      new AZStateStack(),
    contextChangeTracker,
    goalStateRegistry,
    goalIdentityRegistry,
    identifierStateRegistry:
      new AZDefaultIdentifierLinkStateRegistry(),
    structuralRegistry:
      new AZDefaultGoalStructuralStateRegistry(),
    impasseRegistry:
      new AZDefaultImpasseStateRegistry(),
    bufferedLinkChangesProcessor: {
      process(): void {},
    } as AZBufferedLinkChangesProcessor,
  })

const identifier =
  symbolManager.makeIdentifier('I')

const attribute =
  symbolManager.makeStringConstant(
    'answer',
  )

const value =
  symbolManager.makeStringConstant(
    'Rabat',
  )

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

generatedPreferences.push(
  preference,
)

preferenceMemory.add(
  preference,
)

const slotBefore =
  preferenceMemory.getSlot(
    identifier,
    attribute,
  )

assert.notEqual(
  slotBefore,
  null,
  'preference must create a slot',
)

assert.equal(
  slotBefore!.wmes.length,
  0,
  'slot must initially contain no WME',
)

decision.decideRuntime.execute()

const slotAfter =
  preferenceMemory.getSlot(
    identifier,
    attribute,
  )

assert.notEqual(
  slotAfter,
  null,
)

assert.equal(
  slotAfter!.wmes.length,
  0,
  'DECIDE must not create a non-context WME',
)

assert.equal(
  slotAfter!.changed,
  true,
  'DECIDE must leave changed non-context slots pending',
)

console.log(
  'AZ decision runtime assembly: OK',
)
