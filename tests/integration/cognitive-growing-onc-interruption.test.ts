import { strict as assert } from 'node:assert'

import type { CycleObservation } from '../../src/engines/cognitive/az/monitoring/CycleObservation'
import type { CycleObservationHandler } from '../../src/engines/cognitive/az/monitoring/CycleObservationHandler'
import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import type { Mission } from '../../src/models/Mission'

class RecordingObservationHandler
  implements CycleObservationHandler
{
  public readonly observations:
    CycleObservation[] = []

  public handle(
    observation: CycleObservation,
  ): void {
    this.observations.push(observation)
  }
}

async function main(): Promise<void> {
  const observationHandler =
    new RecordingObservationHandler()

  const engine =
    new AZNativeCognitiveEngine(
      undefined,
      observationHandler,
    )

  const mission: Mission = {
    id: 'az-growing-onc-interruption',
    request:
      'Donne-moi la conception du noyau AZ.',
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
    'FAILED',
  )

  assert.equal(
    observationHandler.observations.length,
    4,
  )

  assert.equal(
    (completed.result as { answer: string } | null)?.answer,
    'Cognitive non-progress detected: GROWING_ONC_RECURSION.',
  )

  console.log(
    'AZ growing ONC controlled interruption: OK',
  )
}

void main()

