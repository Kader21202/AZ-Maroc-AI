import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import { DefaultAZContradictoryEvidenceRejectionProductionFactory } from '../../src/engines/cognitive/az/kernel/DefaultAZContradictoryEvidenceRejectionProductionFactory'
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
      dependencies => {
        const baseFactory =
          new DefaultAZContradictoryEvidenceRejectionProductionFactory(
            dependencies,
          )

        return {
          createProposalProductions: () =>
            baseFactory.createProposalProductions(),

          createApplicationProductions:
            outputLinkIdentifier =>
              baseFactory
                .createApplicationProductions(
                  outputLinkIdentifier,
                )
                .filter(
                  production =>
                    production.name !==
                    'az-third-operator-rejection-application',
                ),
        }
      },
    )

  const mission: Mission = {
    id: 'az-tsk-161-contradictory-evidence-rejection-causal-dependency',
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
          'STRING_CONSTANT:\\"contradicts\\"',
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
          'STRING_CONSTANT:\\"rejected\\"',
        ),
    ),
    false,
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
    'AZ TSK-161 contradictory evidence rejection causal dependency: OK',
  )
}

void main()
