import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import { DefaultAZProvenanceAwareEvidenceVerificationProductionFactory } from '../../src/engines/cognitive/az/kernel/DefaultAZProvenanceAwareEvidenceVerificationProductionFactory'
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
          new DefaultAZProvenanceAwareEvidenceVerificationProductionFactory(
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
                .map(production => {
                  if (
                    production.name !==
                    'az-second-operator-evidence-application'
                  ) {
                    return production
                  }

                  return {
                    ...production,
                    actions:
                      production.actions.filter(
                        action =>
                          !(
                            action.type ===
                              'MAKE' &&
                            action.attribute.type ===
                              'SYMBOL' &&
                            action.attribute.symbol
                              .type ===
                              'STRING_CONSTANT' &&
                            action.attribute.symbol
                              .value ===
                              'source-id'
                          ),
                      ),
                  }
                }),
        }
      },
    )

  const mission: Mission = {
    id: 'az-tsk-160-provenance-causal-dependency',
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

  assert.notEqual(
    completed.status,
    'COMPLETED',
  )

  assert.equal(
    observationHandler.observations.some(
      observation =>
        observation.structuralState.includes(
          'STRING_CONSTANT:\\"evidence\\"',
        ),
    ),
    true,
  )

  assert.equal(
    observationHandler.observations.some(
      observation =>
        observation.structuralState.includes(
          'STRING_CONSTANT:\\"content\\"',
        ),
    ),
    true,
  )

  assert.equal(
    observationHandler.observations.some(
      observation =>
        observation.structuralState.includes(
          'STRING_CONSTANT:\\"supports\\"',
        ),
    ),
    true,
  )

  assert.equal(
    observationHandler.observations.some(
      observation =>
        observation.structuralState.includes(
          'STRING_CONSTANT:\\"source-id\\"',
        ),
    ),
    false,
  )

  assert.equal(
    observationHandler.observations.some(
      observation =>
        observation.structuralState.includes(
          'STRING_CONSTANT:\\"verified\\"',
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

  console.log(
    'AZ TSK-160 provenance causal dependency negative control: OK',
  )
}

void main()
