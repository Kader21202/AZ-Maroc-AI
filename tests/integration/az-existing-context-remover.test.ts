import { strict as assert } from 'node:assert'

import { AZContextSlotWmeRemover } from '../../src/engines/cognitive/az/core/decision/AZContextSlotWmeRemover'
import { AZContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceWmeRegistry'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
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
import { AZDefaultImpasseStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZLowerContextCreator } from '../../src/engines/cognitive/az/core/state/AZLowerContextCreator'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import { AZExistingContextRemover } from '../../src/engines/cognitive/az/core/state/AZExistingContextRemover'

function build() {
  const symbolManager =
    new AZSymbolManager()

  const predefinedSymbols =
    new AZPredefinedSymbols(
      symbolManager,
    )

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

  const impasseRegistry =
    new AZDefaultImpasseStateRegistry()

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

  const topCreator =
    new AZTopContextCreator(
      symbolManager,
      predefinedSymbols,
      workingMemory,
      stack,
      stateStack,
      initializer,
      structuralRegistry,
    )

  const lowerCreator =
    new AZLowerContextCreator(
      symbolManager,
      predefinedSymbols,
      workingMemory,
      stack,
      stateStack,
      initializer,
      goalStateRegistry,
      structuralRegistry,
      impasseRegistry,
    )

  const contextPreferenceWmeRegistry =
    new AZContextPreferenceWmeRegistry()

  const remover =
    new AZExistingContextRemover(
      stack,
      stateStack,
      preferenceMemory,
      new AZContextSlotWmeRemover(
        contextPreferenceWmeRegistry,
      ),
      goalStateRegistry,
      structuralRegistry,
      impasseRegistry,
    )

  const matchSet =
    new AZMatchSet()

  return {
    symbolManager,
    predefinedSymbols,
    workingMemory,
    preferenceMemory,
    goalStateRegistry,
    structuralRegistry,
    impasseRegistry,
    stack,
    topCreator,
    lowerCreator,
    remover,
    matchSet,
  }
}

function makeRetraction(
  goal:
    ReturnType<AZSymbolManager['makeIdentifier']>,
  level: number,
) {
  const production: AZProduction = {
    name: `retraction-${goal.id}`,
    declaredSupport: 'UNDECLARED',
    conditions: [],
    actions: [],
    instantiations: [],
  }

  const productionNode:
    AZProductionNode = {
      type: 'PRODUCTION',
      nodeId: level,
      parent: null,
      children: [],
      production,
      tokens: [],
    }

  const instantiation:
    AZInstantiation = {
      id: level,
      production,
      instantiatedConditions: [],
      matchGoal: goal,
      matchGoalLevel: level,
      inMatchSet: true,
      generatedPreferences: [],
      reteToken: null,
      reteWme: null,
    }

  return {
    instantiation,
    productionNode,
  }
}

function addGoalPreference(
  runtime: ReturnType<typeof build>,
  goal:
    ReturnType<AZSymbolManager['makeIdentifier']>,
  level: number,
) {
  const owner =
    runtime.symbolManager
      .makeIdentifier('I')

  const attribute =
    runtime.symbolManager
      .makeStringConstant(
        `goal-pref-${level}`,
      )

  const value =
    runtime.symbolManager
      .makeStringConstant(
        `value-${level}`,
      )

  const production: AZProduction = {
    name: `preference-${goal.id}`,
    declaredSupport: 'UNDECLARED',
    conditions: [],
    actions: [],
    instantiations: [],
  }

  const instantiation:
    AZInstantiation = {
      id: 100 + level,
      production,
      instantiatedConditions: [],
      matchGoal: goal,
      matchGoalLevel: level,
      inMatchSet: true,
      generatedPreferences: [],
      reteToken: null,
      reteWme: null,
    }

  const preference = {
    type: 'ACCEPTABLE' as const,
    identifier: owner,
    attribute,
    value,
    referent: null,
    level,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: true,
    slot: null,
    instantiation,
  }

  runtime.preferenceMemory.add(
    preference,
  )

  return {
    owner,
    attribute,
    preference,
  }
}

function addOperatorWme(
  runtime: ReturnType<typeof build>,
  goal:
    ReturnType<AZSymbolManager['makeIdentifier']>,
) {
  const structural =
    runtime.structuralRegistry.get(goal)

  assert.notEqual(
    structural.operatorSlot,
    null,
  )

  const operator =
    runtime.symbolManager
      .makeIdentifier('O')

  const wme =
    runtime.workingMemory.createElement(
      goal,
      runtime.predefinedSymbols.operator,
      operator,
    )

  structural.operatorSlot!.wmes.push(
    wme,
  )

  runtime.workingMemory.scheduleAdd(
    wme,
  )

  return wme
}

/*
 * Remove the whole two-level branch.
 */
{
  const runtime = build()

  const top =
    runtime.topCreator.create()

  const lower =
    runtime.lowerCreator.create(
      top,
      runtime.predefinedSymbols.operator,
      'TIE',
    )

  const topStructural =
    runtime.structuralRegistry.get(
      top.goal,
    )

  const lowerStructural =
    runtime.structuralRegistry.get(
      lower.goal,
    )

  assert.equal(
    topStructural.impasseWmes.length,
    2,
  )

  assert.equal(
    lowerStructural.impasseWmes.length,
    6,
  )

  addOperatorWme(
    runtime,
    top.goal,
  )

  addOperatorWme(
    runtime,
    lower.goal,
  )

  const topPreference =
    addGoalPreference(
      runtime,
      top.goal,
      1,
    )

  const lowerPreference =
    addGoalPreference(
      runtime,
      lower.goal,
      2,
    )

  const topRetraction =
    makeRetraction(
      top.goal,
      1,
    )

  const lowerRetraction =
    makeRetraction(
      lower.goal,
      2,
    )

  runtime.matchSet.addRetraction(
    topRetraction,
  )

  runtime.matchSet.addRetraction(
    lowerRetraction,
  )

  runtime.workingMemory
    .applyBufferedChanges()

  assert.equal(
    runtime.workingMemory
      .getElements().length,
    10,
  )

  assert.equal(
    runtime.matchSet.hasRetraction(
      top.goal,
    ),
    true,
  )

  assert.equal(
    runtime.matchSet.hasRetraction(
      lower.goal,
    ),
    true,
  )

  assert.equal(
    runtime.remover.remove(
      top.goal,
      runtime.workingMemory,
      runtime.matchSet,
    ),
    true,
  )

  /*
   * AZ lifecycle invariant:
   * goal identity must survive while context WME removals
   * are still buffered and have not propagated through RETE.
   */
  assert.equal(
    runtime.goalStateRegistry.isGoal(top.goal),
    true,
    'AZ invariant: top goal identity must survive buffered WME removal',
  )

  assert.equal(
    runtime.goalStateRegistry.isGoal(lower.goal),
    true,
    'AZ invariant: lower goal identity must survive buffered WME removal',
  )
  /*
   * Removals are buffered until the WM
   * changes are applied.
   */
  assert.equal(
    runtime.workingMemory
      .getElements().length,
    10,
  )

  runtime.workingMemory
    .applyBufferedChanges()

  assert.equal(
    runtime.workingMemory
      .getElements().length,
    0,
  )

  assert.equal(
    runtime.stack.top,
    null,
  )

  assert.equal(
    runtime.stack.bottom,
    null,
  )

  assert.equal(
    runtime.goalStateRegistry.isGoal(
      top.goal,
    ),
    false,
  )

  assert.equal(
    runtime.goalStateRegistry.isGoal(
      lower.goal,
    ),
    false,
  )

  assert.equal(
    runtime.structuralRegistry.has(
      top.goal,
    ),
    false,
  )

  assert.equal(
    runtime.structuralRegistry.has(
      lower.goal,
    ),
    false,
  )

  assert.equal(
    runtime.impasseRegistry.isImpasse(
      lower.goal,
    ),
    false,
  )

  assert.equal(
    runtime.preferenceMemory.getSlot(
      topPreference.owner,
      topPreference.attribute,
    )?.allPreferences.includes(
      topPreference.preference,
    ) ?? false,
    false,
  )

  assert.equal(
    runtime.preferenceMemory.getSlot(
      lowerPreference.owner,
      lowerPreference.attribute,
    )?.allPreferences.includes(
      lowerPreference.preference,
    ) ?? false,
    false,
  )

  assert.equal(
    runtime.matchSet.hasRetraction(
      top.goal,
    ),
    false,
  )

  assert.equal(
    runtime.matchSet.hasRetraction(
      lower.goal,
    ),
    false,
  )

  const nilRetractions = [
    runtime.matchSet
      .takeNextNilGoalRetraction(),
    runtime.matchSet
      .takeNextNilGoalRetraction(),
  ]

  assert.equal(
    nilRetractions.includes(
      topRetraction.instantiation,
    ),
    true,
  )

  assert.equal(
    nilRetractions.includes(
      lowerRetraction.instantiation,
    ),
    true,
  )
}

/*
 * Removing only a lower context must
 * preserve the higher context.
 */
{
  const runtime = build()

  const top =
    runtime.topCreator.create()

  const lower =
    runtime.lowerCreator.create(
      top,
      runtime.predefinedSymbols.operator,
      'CONFLICT',
    )

  runtime.workingMemory
    .applyBufferedChanges()

  const originalRemovePreferencesFromGoal = runtime.preferenceMemory.removePreferencesFromGoal.bind(runtime.preferenceMemory)
  runtime.preferenceMemory.removePreferencesFromGoal = ((goal) => {
    if (goal === lower.goal) {
      assert.equal(runtime.stack.bottom, top, 'AZ ordering: lower goal must be detached before preference cleanup')
      assert.equal(top.lower, null, 'AZ ordering: higher goal must no longer reference lower goal before preference cleanup')
    }
    return originalRemovePreferencesFromGoal(goal)
  }) as typeof runtime.preferenceMemory.removePreferencesFromGoal

  assert.equal(
    runtime.remover.remove(
      lower.goal,
      runtime.workingMemory,
      runtime.matchSet,
    ),
    true,
  )

  runtime.workingMemory
    .applyBufferedChanges()

  assert.equal(
    runtime.stack.top,
    top,
  )

  assert.equal(
    runtime.stack.bottom,
    top,
  )

  assert.equal(
    top.lower,
    null,
  )

  assert.equal(
    runtime.goalStateRegistry.isGoal(
      top.goal,
    ),
    true,
  )

  assert.equal(
    runtime.structuralRegistry.has(
      top.goal,
    ),
    true,
  )

  assert.equal(
    runtime.goalStateRegistry.isGoal(
      lower.goal,
    ),
    false,
  )

  assert.equal(
    runtime.structuralRegistry.has(
      lower.goal,
    ),
    false,
  )

  /*
   * Only the two top-context structural
   * WMEs remain.
   */
  assert.equal(
    runtime.workingMemory
      .getElements().length,
    2,
  )
}

/*
 * An unknown goal changes nothing.
 */
{
  const runtime = build()

  const top =
    runtime.topCreator.create()

  runtime.workingMemory
    .applyBufferedChanges()

  const unknown =
    runtime.symbolManager
      .makeIdentifier('S')

  assert.equal(
    runtime.remover.remove(
      unknown,
      runtime.workingMemory,
      runtime.matchSet,
    ),
    false,
  )

  assert.equal(
    runtime.stack.top,
    top,
  )

  assert.equal(
    runtime.goalStateRegistry.isGoal(
      top.goal,
    ),
    true,
  )
}

console.log(
  'AZ existing context remover: OK',
)
