import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import { DefaultAZInsufficientEvidenceHandlingProductionFactory } from '../../src/engines/cognitive/az/kernel/DefaultAZInsufficientEvidenceHandlingProductionFactory'
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
      dependencies =>
        new DefaultAZInsufficientEvidenceHandlingProductionFactory(
          dependencies,
        ),
    )

  const mission: Mission = {
    id: 'az-tsk-162-insufficient-evidence-handling',
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
    observationHandler.observations.some(
      observation =>
        observation.structuralState.includes(
          'STRING_CONSTANT:\\"insufficient\\"',
        ),
    ),
    true,
  )

  assert.equal(
    observationHandler.observations.some(
      observation =>
        observation.structuralState.includes(
          'STRING_CONSTANT:\\"verification\\"',
        ) &&
        observation.structuralState.includes(
          'STRING_CONSTANT:\\"unknown\\"',
        ),
    ),
    true,
  )

  assert.equal(
    observationHandler.observations.some(
      observation =>
        observation.outputProduced,
    ),
    false,
  )

  assert.notEqual(
    completed.status,
    'COMPLETED',
  )

  console.log(
    'AZ TSK-162 insufficient evidence handling: OK',
  )
}

void main()
