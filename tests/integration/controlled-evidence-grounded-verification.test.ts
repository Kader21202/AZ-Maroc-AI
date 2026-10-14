import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import { DefaultAZEvidenceGroundedVerificationProductionFactory } from '../../src/engines/cognitive/az/kernel/DefaultAZEvidenceGroundedVerificationProductionFactory'
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
        new DefaultAZEvidenceGroundedVerificationProductionFactory(
          dependencies,
        ),
    )

  const mission: Mission = {
    id: 'az-tsk-159-evidence-grounded-verification',
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
    4,
  )

  const first =
    observationHandler.observations[0]

  const second =
    observationHandler.observations[1]

  const third =
    observationHandler.observations[2]

  const fourth =
    observationHandler.observations[3]

  assert.ok(first !== undefined)
  assert.ok(second !== undefined)
  assert.ok(third !== undefined)
  assert.ok(fourth !== undefined)

  assert.ok(
    first.structuralState.includes(
      'STRING_CONSTANT:\\"analyzed\\"',
    ),
  )

  assert.equal(
    first.structuralState.includes(
      'STRING_CONSTANT:\\"evidence\\"',
    ),
    false,
  )

  assert.ok(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"evidence\\"',
    ),
  )

  assert.ok(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"supports\\"',
    ),
  )

  assert.equal(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"verified\\"',
    ),
    false,
  )

  assert.ok(
    third.structuralState.includes(
      'STRING_CONSTANT:\\"evidence\\"',
    ),
  )

  assert.ok(
    third.structuralState.includes(
      'STRING_CONSTANT:\\"supports\\"',
    ),
  )

  assert.ok(
    third.structuralState.includes(
      'STRING_CONSTANT:\\"verification\\"',
    ),
  )

  assert.ok(
    third.structuralState.includes(
      'STRING_CONSTANT:\\"verified\\"',
    ),
  )

  assert.equal(
    third.outputProduced,
    false,
  )

  assert.equal(
    third.halted,
    false,
  )

  assert.ok(
    fourth.structuralState.includes(
      'STRING_CONSTANT:\\"verified\\"',
    ),
  )

  assert.ok(
    fourth.structuralState.includes(
      'STRING_CONSTANT:\\"result\\"',
    ),
  )

  assert.equal(
    fourth.outputProduced,
    true,
  )

  assert.equal(
    fourth.halted,
    true,
  )

  console.log(
    'AZ TSK-159 evidence-grounded verification: OK',
  )
}

void main()
