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
  const observationHandler =
    new RecordingCycleObservationHandler()

  const engine =
    new AZNativeCognitiveEngine(
      undefined,
      observationHandler,
    )

  const mission: Mission = {
    id: 'az-tsk-157-controlled-multi-step-reasoning',
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
    2,
  )

  const first =
    observationHandler.observations[0]

  const second =
    observationHandler.observations[1]

  assert.ok(first !== undefined)
  assert.ok(second !== undefined)

  assert.equal(first.cycle, 1)
  assert.equal(first.impasseType, null)
  assert.equal(first.outputProduced, false)
  assert.equal(first.halted, false)

  assert.ok(
    first.structuralState.includes(
      'STRING_CONSTANT:\\"stage\\"',
    ),
  )

  assert.ok(
    first.structuralState.includes(
      'STRING_CONSTANT:\\"analyzed\\"',
    ),
  )

  assert.equal(second.cycle, 2)
  assert.equal(second.impasseType, null)
  assert.equal(second.outputProduced, true)
  assert.equal(second.halted, true)

  assert.ok(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"stage\\"',
    ),
  )

  assert.ok(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"analyzed\\"',
    ),
  )

  assert.ok(
    second.structuralState.includes(
      'STRING_CONSTANT:\\"result\\"',
    ),
  )

  console.log(
    'AZ TSK-157 controlled multi-step reasoning: OK',
  )
}

void main()
