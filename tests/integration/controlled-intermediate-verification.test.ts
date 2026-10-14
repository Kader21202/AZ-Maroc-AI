import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import { DefaultAZVerifiedMultiStepProductionFactory } from '../../src/engines/cognitive/az/kernel/DefaultAZVerifiedMultiStepProductionFactory'
import type { CycleObservation } from '../../src/engines/cognitive/az/monitoring/CycleObservation'
import type { CycleObservationHandler } from '../../src/engines/cognitive/az/monitoring/CycleObservationHandler'
import type { Mission } from '../../src/models/Mission'

class RecordingCycleObservationHandler
  implements CycleObservationHandler
{
  public readonly observations:
    CycleObservation[] = []

  public handle(
    observation: CycleObservation,
  ): void {
    this.observations.push(
      observation,
    )
  }
}

async function main(): Promise<void> {
  const observationHandler =
    new RecordingCycleObservationHandler()

  const engine =
    new AZNativeCognitiveEngine(
      undefined,
      observationHandler,
      undefined,
      (dependencies) =>
        new DefaultAZVerifiedMultiStepProductionFactory(
          dependencies,
        ),
    )

  const mission: Mission = {
    id: 'az-tsk-158-controlled-intermediate-verification',
    request:
      'Quel est le statut de la plateforme ?',
    status: 'CREATED',
    workingState: {
      situation: {},
      goals: [],
      activeAction: null,
      intermediateResults: [],
    },
    result: null,
  }

  const completed =
    await engine.process(mission)

  assert.equal(
    completed.status,
    'COMPLETED',
  )

  assert.equal(
    observationHandler.observations.length,
    3,
  )

  const first =
    observationHandler.observations[0]

  const second =
    observationHandler.observations[1]

  const third =
    observationHandler.observations[2]

  assert.ok(first !== undefined)
  assert.ok(second !== undefined)
  assert.ok(third !== undefined)

  assert.equal(first.cycle, 1)
  assert.equal(first.outputProduced, false)
  assert.equal(first.halted, false)

  assert.ok(
    first.structuralState.includes(
      'STRING_CONSTANT:\\"analyzed\\"',
    ),
  )

  assert.equal(
    first.structuralState.includes(
      'STRING_CONSTANT:\\"verified\\"',
    ),
    false,
  )

  assert.equal(second.cycle, 2)
  assert.equal(second.outputProduced, false)
  assert.equal(second.halted, false)

  assert.ok(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"analyzed\\"',
    ),
  )

  assert.ok(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"verification\\"',
    ),
  )

  assert.ok(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"verified\\"',
    ),
  )

  assert.equal(third.cycle, 3)
  assert.equal(third.outputProduced, true)
  assert.equal(third.halted, true)

  assert.ok(
    third.structuralState.includes(
      'STRING_CONSTANT:\\"verified\\"',
    ),
  )

  assert.ok(
    third.structuralState.includes(
      'STRING_CONSTANT:\\"result\\"',
    ),
  )

  console.log(
    'AZ TSK-158 controlled intermediate verification: OK',
  )
}

void main()


