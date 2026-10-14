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
import { AZDefaultImpasseStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZLowerContextCreator } from '../../src/engines/cognitive/az/core/state/AZLowerContextCreator'

function build() {
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

  const parentGoal =
    symbolManager.makeIdentifier('S')

  initializer.initialize(
    parentGoal,
    1,
  )

  const parent =
    stack.setTop(parentGoal)

  stateStack.setTop({}, parentGoal)

  const creator =
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

  return {
    symbolManager,
    predefinedSymbols,
    workingMemory,
    goalStateRegistry,
    structuralRegistry,
    impasseRegistry,
    stack,
    parent,
    creator,
  }
}

{
  const runtime = build()

  const lower =
    runtime.creator.create(
      runtime.parent,
      runtime.predefinedSymbols.operator,
      'TIE',
    )

  assert.equal(
    runtime.stack.bottom,
    lower,
  )

  assert.equal(
    runtime.goalStateRegistry.getLevel(
      lower.goal,
    ),
    2,
  )

  assert.equal(
    runtime.impasseRegistry.isImpasse(
      lower.goal,
    ),
    true,
  )

  const structural =
    runtime.structuralRegistry.get(
      lower.goal,
    )

  assert.equal(
    structural.impasseType,
    'TIE',
  )

  assert.equal(
    structural.impasseAttribute,
    runtime.predefinedSymbols.operator,
  )

  assert.equal(
    structural.impasseWmes.length,
    6,
  )

  runtime.workingMemory.applyBufferedChanges()

  const wmes =
    runtime.workingMemory.getElements()

  assert.equal(wmes.length, 6)

  assert.ok(
    wmes.some(
      wme =>
        wme.attribute ===
          runtime.predefinedSymbols.superstate &&
        wme.value === runtime.parent.goal,
    ),
  )

  assert.ok(
    wmes.some(
      wme =>
        wme.attribute ===
          runtime.predefinedSymbols.impasse &&
        wme.value ===
          runtime.predefinedSymbols.tie,
    ),
  )

  assert.ok(
    wmes.some(
      wme =>
        wme.attribute ===
          runtime.predefinedSymbols.choices &&
        wme.value ===
          runtime.predefinedSymbols.multiple,
    ),
  )
}

{
  const runtime = build()

  const lower =
    runtime.creator.create(
      runtime.parent,
      runtime.predefinedSymbols.operator,
      'NO_CHANGE',
    )

  const structural =
    runtime.structuralRegistry.get(
      lower.goal,
    )

  assert.equal(
    structural.impasseType,
    'ONC',
  )

  runtime.workingMemory.applyBufferedChanges()

  assert.ok(
    runtime.workingMemory
      .getElements()
      .some(
        wme =>
          wme.attribute ===
            runtime.predefinedSymbols.impasse &&
          wme.value ===
            runtime.predefinedSymbols.noChange,
      ),
  )
}

{
  for (const testCase of [
    {
      type: 'CONSTRAINT_FAILURE' as const,
      impasse: 'constraintFailure' as const,
      choices: 'none' as const,
    },
    {
      type: 'CONFLICT' as const,
      impasse: 'conflict' as const,
      choices: 'multiple' as const,
    },
  ]) {
    const runtime = build()

    const lower =
      runtime.creator.create(
        runtime.parent,
        runtime.predefinedSymbols.operator,
        testCase.type,
      )

    const structural =
      runtime.structuralRegistry.get(
        lower.goal,
      )

    assert.equal(
      structural.impasseType,
      testCase.type,
    )

    runtime.workingMemory.applyBufferedChanges()

    const wmes =
      runtime.workingMemory.getElements()

    assert.ok(
      wmes.some(
        wme =>
          wme.attribute ===
            runtime.predefinedSymbols.impasse &&
          wme.value ===
            runtime.predefinedSymbols[
              testCase.impasse
            ],
      ),
    )

    assert.ok(
      wmes.some(
        wme =>
          wme.attribute ===
            runtime.predefinedSymbols.choices &&
          wme.value ===
            runtime.predefinedSymbols[
              testCase.choices
            ],
      ),
    )
  }
}

{
  for (
    const impasseType of [
      'NONE',
      'ONC',
      'SNC',
    ] as const
  ) {
    const runtime = build()

    assert.throws(
      () =>
        runtime.creator.create(
          runtime.parent,
          runtime.predefinedSymbols.operator,
          impasseType,
        ),
      /Lower context requires a decision impasse/,
    )
  }
}

{
  const runtime = build()

  const foreignGoal =
    runtime.symbolManager.makeIdentifier('S')

  const foreignParent = {
    goal: foreignGoal,
    higher: null,
    lower: null,
  }

  assert.throws(
    () =>
      runtime.creator.create(
        foreignParent,
        runtime.predefinedSymbols.operator,
        'TIE',
      ),
    /Parent context does not belong to the goal stack/,
  )
}
console.log(
  'AZ lower context creator: OK',
)

