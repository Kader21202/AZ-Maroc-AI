import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import { DefaultAZVerifiedMultiStepProductionFactory } from '../../src/engines/cognitive/az/kernel/DefaultAZVerifiedMultiStepProductionFactory'
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
      (dependencies) =>
        new DefaultAZVerifiedMultiStepProductionFactory(
          dependencies,
        ),
      lineageHandler,
    )

  const mission: Mission = {
    id: 'az-tsk-165-transitive-cognitive-lineage',
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

  const verificationPremise =
    lineageHandler.observations
      .find(
        observation =>
          observation.productionName ===
          'az-verified-third-operator-proposal',
      )
      ?.premises.find(
        premise =>
          premise.attribute === 'verification' &&
          premise.value === 'verified',
      )

  assert.ok(
    verificationPremise !== undefined,
    'AZ must observe verification=verified as a premise',
  )

  assert.deepEqual(
    verificationPremise.producerProductionChain,
    [
      'az-second-operator-verification-application',
      'az-stage-verification-operator-proposal',
      'az-operator-stage-application',
      'az-question-operator-proposal',
    ],
  )

  console.log(
    'AZ transitive cognitive lineage: OK',
  )
}

void main()


