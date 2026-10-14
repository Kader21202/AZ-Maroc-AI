import assert from 'node:assert/strict'

import type { AZContextPreferenceSemantics } from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceSemantics'
import { AZContextSlotDecider } from '../../src/engines/cognitive/az/core/decision/AZContextSlotDecider'
import { AZContextSlotsDecider } from '../../src/engines/cognitive/az/core/decision/AZContextSlotsDecider'
import { AZDefaultContextSlotDecidability } from '../../src/engines/cognitive/az/core/decision/AZDefaultContextSlotDecidability'
import { AZContextSlotWmeRemover } from '../../src/engines/cognitive/az/core/decision/AZContextSlotWmeRemover'
import { AZContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceWmeRegistry'
import type { AZImpasseItemsUpdater } from '../../src/engines/cognitive/az/core/decision/AZImpasseItemsUpdater'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZContextChangeTracker } from '../../src/engines/cognitive/az/core/state/AZContextChangeTracker'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import type { AZExistingContextRemover } from '../../src/engines/cognitive/az/core/state/AZExistingContextRemover'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import type { AZLowerContextCreator } from '../../src/engines/cognitive/az/core/state/AZLowerContextCreator'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const predefined = new AZPredefinedSymbols(symbols)
const goalRegistry = new AZDefaultGoalStateRegistry()
const tracker = new AZContextChangeTracker(goalRegistry)
const preferenceMemory = new AZPreferenceMemory(null, null, tracker)
const workingMemory = new AZWorkingMemory()
const matchSet = new AZMatchSet()
const contextStack = new AZGoalContextStack()
const structuralRegistry = new AZDefaultGoalStructuralStateRegistry()

const state = symbols.makeIdentifier('S')
const selectedOperator = symbols.makeIdentifier('O')
goalRegistry.registerGoal(state, 1)
const parent = contextStack.setTop(state)
structuralRegistry.register(state)

const slot = preferenceMemory.getOrCreateContextSlot(state, predefined.operator)
const selectedWme = workingMemory.createElement(state, predefined.operator, selectedOperator, false)
slot.wmes.push(selectedWme)
workingMemory.scheduleAdd(selectedWme)
workingMemory.applyBufferedChanges()

assert.equal(workingMemory.getElements().includes(selectedWme), true, 'precondition: selected operator WME must be in working memory')

const registry = new AZContextPreferenceWmeRegistry()
const existingContextRemover = { remove(): boolean { throw new Error('No existing lower context should be removed') } } as unknown as AZExistingContextRemover
let createdLowerGoal: ReturnType<typeof symbols.makeIdentifier> | null = null
const lowerContextCreator = { create(targetParent: typeof parent, attribute: typeof predefined.operator, type: 'CONSTRAINT_FAILURE' | 'CONFLICT' | 'TIE' | 'NO_CHANGE') {
  assert.equal(type, 'NO_CHANGE')
  assert.equal(attribute, predefined.operator)
  const goal = symbols.makeIdentifier('S')
  createdLowerGoal = goal
  const created = contextStack.appendLower(targetParent, goal)
  structuralRegistry.register(goal, { impasseType: 'ONC', impasseAttribute: attribute })
  return created
} } as unknown as AZLowerContextCreator
const impasseItemsUpdater = { update(): void {} } as unknown as AZImpasseItemsUpdater
const semantics = { evaluate() { throw new Error('Non-decidable bottom slot must not use preference semantics') } } as unknown as AZContextPreferenceSemantics
const slotDecider = new AZContextSlotDecider(semantics, contextStack, structuralRegistry, lowerContextCreator, existingContextRemover, new AZContextSlotWmeRemover(registry), registry, impasseItemsUpdater, predefined.state)
const slotsDecider = new AZContextSlotsDecider(contextStack, tracker, predefined, new AZDefaultContextSlotDecidability(), slotDecider)

preferenceMemory.markSlotAsChanged(slot)
slotsDecider.decideAll(preferenceMemory, workingMemory, matchSet)
workingMemory.applyBufferedChanges()

assert.notEqual(createdLowerGoal, null, 'non-decidable bottom operator slot must create NO_CHANGE substate')
assert.equal(slot.wmes.length, 1, 'operator NO_CHANGE must preserve the selected superstate operator WME')
assert.equal(slot.wmes[0], selectedWme, 'the preserved WME must be the original selected operator WME')
assert.equal(workingMemory.getElements().includes(selectedWme), true, 'selected superstate operator must remain in working memory while its NO_CHANGE substate exists')

console.log('AZ operator NO_CHANGE preserves superstate operator: OK')
