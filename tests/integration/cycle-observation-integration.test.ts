import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
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
  const mission: Mission = {
    id: 'az-cycle-observation-integration',
    request: 'Quel est le statut de la plateforme ?',
    status: 'CREATED',
    workingState: {
      situation: {},
      goals: [],
      activeAction: null,
      intermediateResults: [],
    },
    result: null,
  }

  const observationHandler =
    new RecordingCycleObservationHandler()

  const engine =
    new AZNativeCognitiveEngine(
      undefined,
      observationHandler,
    )

  const completed =
    await engine.process(
      mission,
    )

  assert.equal(
    completed.status,
    'COMPLETED',
  )

  assert.equal(
    observationHandler.observations.length,
    2,
  )

  assert.deepEqual(
    observationHandler.observations.map(
      (observation) =>
        observation.cycle,
    ),
    [1, 2],
  )

  assert.ok(
    observationHandler.observations.every(
      (observation) =>
        observation.structuralState.length > 0,
    ),
  )

  const finalObservation =
    observationHandler.observations.at(-1)

  assert.ok(
    finalObservation !== undefined,
  )

  assert.equal(
    finalObservation.outputProduced,
    true,
  )

  assert.equal(
    finalObservation.halted,
    true,
  )

  console.log(
    'AZ cycle-observation integration: OK',
  )
}

void main()
