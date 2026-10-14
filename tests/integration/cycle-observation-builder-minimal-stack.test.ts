import { strict as assert } from 'node:assert'

import { AZCycleObservationBuilder } from '../../src/engines/cognitive/AZCycleObservationBuilder'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

function main(): void {
  const symbols =
    new AZSymbolManager()

  const goal1 =
    symbols.makeIdentifier('G')

  const goal2 =
    symbols.makeIdentifier('G')

  const operator =
    symbols.makeIdentifier('O')

  const operatorAttribute =
    symbols.makeStringConstant(
      'operator',
    )

  const stack =
    new AZStateStack()

  const top =
    stack.setTop(
      {},
      goal1,
    )

  stack.appendLower(
    top,
    {},
    goal2,
  )

  const structuralRegistry =
    new AZDefaultGoalStructuralStateRegistry()

  structuralRegistry.register(
    goal1,
  )

  structuralRegistry.register(
    goal2,
    {
      impasseType: 'NO_CHANGE',

      operatorSlot: {
        identifier: goal2,
        attribute:
          operatorAttribute,

        allPreferences: [],

        preferencesByType:
          new Map(),

        wmes: [
          {
            timetag: 1,
            identifier: goal2,
            attribute:
              operatorAttribute,
            value: operator,
            acceptable: true,
          },
        ],

        isaContextSlot: true,

        impasseType: 'NONE',
        impasseId: null,

        acceptablePreferenceChanged:
          false,

        acceptablePreferenceWmes: [],

        changed: false,

        markedForPossibleRemoval:
          false,
      },
    },
  )

  const workingMemory = {
    getElements: () => [],
  }

  const runControl = {
    isHalted: () => false,
    reasonForStopping: () => null,
  }

  const builder =
    new AZCycleObservationBuilder()

  const observation =
    builder.build(
      3,
      stack,
      structuralRegistry,
      workingMemory,
      runControl,
      false,
    )

  assert.equal(
    observation.currentGoalId,
    goal2.id,
  )

  assert.equal(
    observation.goalDepth,
    2,
  )

  assert.equal(
    observation.impasseType,
    'NO_CHANGE',
  )

  assert.equal(
    observation.currentOperatorId,
    operator.id,
  )

  console.log(
    'AZ cycle observation minimal stack contract: OK',
  )
}

main()
