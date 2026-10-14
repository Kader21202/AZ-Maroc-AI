import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import type { CognitiveEvent } from '../../src/engines/cognitive/az/events/CognitiveEvent'
import type { CognitiveEventHandler } from '../../src/engines/cognitive/az/events/CognitiveEventHandler'
import type { Mission } from '../../src/models/Mission'

class RecordingCognitiveEventHandler
  implements CognitiveEventHandler
{
  public readonly events: CognitiveEvent[] = []

  public handle(
    event: CognitiveEvent,
  ): void {
    this.events.push(event)
  }
}

async function main(): Promise<void> {
  const mission: Mission = {
    id: 'az-cognitive-events-test',
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

  const eventHandler =
    new RecordingCognitiveEventHandler()

  const engine =
    new AZNativeCognitiveEngine(
      eventHandler,
    )

  const completed =
    await engine.process(mission)

  assert.equal(
    completed.status,
    'COMPLETED',
  )

  const completedCycles =
    eventHandler.events.filter(
      (event) =>
        event.type ===
        'DECISION_CYCLE_COMPLETED',
    )

  assert.deepEqual(
    completedCycles,
    [
      {
        type: 'DECISION_CYCLE_COMPLETED',
        cycle: 1,
      },
      {
        type: 'DECISION_CYCLE_COMPLETED',
        cycle: 2,
      },
    ],
  )

  const operatorEvents =
    eventHandler.events.filter(
      (event) =>
        event.type ===
        'OPERATOR_SELECTED',
    )

  assert.equal(
    operatorEvents.length,
    2,
  )

  assert.ok(
    operatorEvents.every(
      (event) =>
        event.type === 'OPERATOR_SELECTED' &&
        event.operatorId.length > 0,
    ),
  )

  assert.notEqual(
    operatorEvents[0]?.operatorId,
    operatorEvents[1]?.operatorId,
  )

  const outputEvents =
    eventHandler.events.filter(
      (event) =>
        event.type ===
        'OUTPUT_PRODUCED',
    )

  assert.equal(
    outputEvents.length,
    1,
  )

  assert.deepEqual(
    eventHandler.events.map(
      (event) => event.type,
    ),
    [
      'OPERATOR_SELECTED',
      'DECISION_CYCLE_COMPLETED',
      'OPERATOR_SELECTED',
      'OUTPUT_PRODUCED',
      'DECISION_CYCLE_COMPLETED',
    ],
  )

  assert.deepEqual(
    eventHandler.events.at(-1),
    {
      type: 'DECISION_CYCLE_COMPLETED',
      cycle: 2,
    },
  )

  console.log(
    'AZ cognitive event protocol: OK',
  )
}

void main()
