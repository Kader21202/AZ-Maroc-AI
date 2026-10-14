import { strict as assert } from 'node:assert'

import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultGoalStructuralStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZGoalContextInitializer } from '../../src/engines/cognitive/az/core/state/AZGoalContextInitializer'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'

const symbolManager =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(symbolManager)

const workingMemory =
  new AZWorkingMemory()

const preferenceMemory =
  new AZPreferenceMemory()

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const goalIdentityRegistry =
  new AZDefaultGoalIdentityRegistry()

const identifierStateRegistry =
  new AZDefaultIdentifierLinkStateRegistry()

const structuralRegistry =
  new AZDefaultGoalStructuralStateRegistry()

const stack =
  new AZGoalContextStack()

const stateStack = new AZStateStack()

const initializer =
  new AZGoalContextInitializer(
    goalStateRegistry,
      goalIdentityRegistry,
    identifierStateRegistry,
    structuralRegistry,
    preferenceMemory,
    predefinedSymbols,
  )

const creator =
  new AZTopContextCreator(
    symbolManager,
    predefinedSymbols,
    workingMemory,
    stack,
    stateStack,
    initializer,
    structuralRegistry,
  )

const context =
  creator.create()

assert.equal(
  stack.top,
  context,
)

assert.equal(
  stack.bottom,
  context,
)

assert.equal(
  goalStateRegistry.getLevel(
    context.goal,
  ),
  1,
)

workingMemory.applyBufferedChanges()

const wmes =
  workingMemory.getElements()

assert.equal(
  wmes.length,
  2,
)

assert.ok(
  wmes.some(
    wme =>
      wme.identifier === context.goal &&
      wme.attribute === predefinedSymbols.type &&
      wme.value === predefinedSymbols.state,
  ),
)

assert.ok(
  wmes.some(
    wme =>
      wme.identifier === context.goal &&
      wme.attribute === predefinedSymbols.superstate &&
      wme.value === predefinedSymbols.nil,
  ),
)

assert.equal(
  structuralRegistry
    .get(context.goal)
    .operatorSlot
    ?.isaContextSlot,
  true,
)

console.log(
  'AZ top context creator: OK',
)
