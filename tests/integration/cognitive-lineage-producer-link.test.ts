import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import type { CognitiveLineageObservation } from '../../src/engines/cognitive/az/monitoring/CognitiveLineageObservation'
import type { CognitiveLineageObservationHandler } from '../../src/engines/cognitive/az/monitoring/CognitiveLineageObservationHandler'
import type { Mission } from '../../src/models/Mission'

class RecordingCognitiveLineageObservationHandler
  implements CognitiveLineageObservationHandler
{
  public readonly observations:
    CognitiveLineageObservation[] = []

  public handle(
    observation: CognitiveLineageObservation,
  ): void {
    this.observations.push(
      observation,
    )
  }
}

async function main(): Promise<void> {
  const lineageHandler =
    new RecordingCognitiveLineageObservationHandler()

  const engine =
    new AZNativeCognitiveEngine(
      undefined,
      undefined,
      undefined,
      undefined,
      lineageHandler,
    )

  const mission: Mission = {
    id: 'az-cognitive-lineage-producer-red',
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

  const stagePremise =
    lineageHandler.observations
      .find(
        observation =>
          observation.productionName ===
          'az-stage-second-operator-proposal',
      )
      ?.premises.find(
        premise =>
          premise.attribute === 'stage' &&
          premise.value === 'analyzed',
      )

  assert.ok(
    stagePremise !== undefined,
    'AZ must observe stage=analyzed as a premise',
  )

  assert.equal(
    stagePremise.producerProductionName,
    'az-operator-stage-application',
  )

  console.log(
    'AZ cognitive lineage producer link: OK',
  )
}

void main()
