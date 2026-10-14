import { strict as assert } from 'node:assert'

import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultGoalStructuralStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZGoalContextInitializer } from '../../src/engines/cognitive/az/core/state/AZGoalContextInitializer'

const symbolManager =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(
    symbolManager,
  )

const preferenceMemory =
  new AZPreferenceMemory()

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const goalIdentityRegistry =
  new AZDefaultGoalIdentityRegistry()

const identifierStateRegistry =
  new AZDefaultIdentifierLinkStateRegistry()

const goalStructuralStateRegistry =
  new AZDefaultGoalStructuralStateRegistry()

const initializer =
  new AZGoalContextInitializer(
    goalStateRegistry,
      goalIdentityRegistry,
    identifierStateRegistry,
    goalStructuralStateRegistry,
    preferenceMemory,
    predefinedSymbols,
  )

const goal =
  symbolManager.makeIdentifier('S')

const operatorSlot =
  initializer.initialize(
    goal,
    3,
  )

assert.equal(
  goalStateRegistry.isGoal(goal),
  true,
)

assert.equal(
  goalStateRegistry.getLevel(goal),
  3,
)

assert.equal(
  operatorSlot.identifier,
  goal,
)

assert.equal(
  operatorSlot.attribute,
  predefinedSymbols.operator,
)

assert.equal(
  operatorSlot.isaContextSlot,
  true,
)

const structuralState =
  goalStructuralStateRegistry.get(goal)

assert.equal(
  structuralState.operatorSlot,
  operatorSlot,
)

assert.equal(
  structuralState.impasseType,
  'NONE',
)

console.log(
  'AZ goal context initializer: OK',
)
