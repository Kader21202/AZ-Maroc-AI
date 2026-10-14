import { strict as assert } from 'node:assert'

import { AZCycleObservationBuilder } from '../../src/engines/cognitive/AZCycleObservationBuilder'
import { AZDefaultCognitiveRunControl } from '../../src/engines/cognitive/az/core/cycle/AZDefaultCognitiveRunControl'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

function main(): void {
  const symbols =
    new AZSymbolManager()

  const workingMemory =
    new AZWorkingMemory()

  const stack =
    new AZStateStack()

  const structuralRegistry =
    new AZDefaultGoalStructuralStateRegistry()

  const goal1 =
    symbols.makeIdentifier('S')

  const goal2 =
    symbols.makeIdentifier('S')

  const operator =
    symbols.makeIdentifier('O')

  const operatorAttribute =
    symbols.makeStringConstant(
      'operator',
    )

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

  workingMemory.scheduleAdd(
    workingMemory.createElement(
      goal2,
      symbols.makeStringConstant(
        'status',
      ),
      symbols.makeStringConstant(
        'active',
      ),
    ),
  )

  workingMemory.applyBufferedChanges()

  const runControl =
    new AZDefaultCognitiveRunControl()

  runControl.halt(
    'completed',
  )

  const builder =
    new AZCycleObservationBuilder()

  const observation =
    builder.build(
      7,
      stack,
      structuralRegistry,
      workingMemory,
      runControl,
      true,
    )

  assert.equal(
    observation.cycle,
    7,
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

  assert.equal(
    observation.outputProduced,
    true,
  )

  assert.equal(
    observation.halted,
    true,
  )

  assert.equal(
    observation.stopReason,
    'completed',
  )

  assert.ok(
    observation.structuralState.length > 0,
  )

  console.log(
    'AZ cycle-observation builder: OK',
  )
}

main()
