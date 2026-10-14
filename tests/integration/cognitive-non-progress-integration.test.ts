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
    id: 'az-non-progress-integration',
    request: 'Donne-moi la conception du noyau AZ.',
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

  await engine.process(
    mission,
  )

  const nonProgressEvents =
    eventHandler.events.filter(
      (event) =>
        event.type ===
        'NO_PROGRESS_DETECTED',
    )

  assert.equal(
    nonProgressEvents.length,
    1,
  )

  assert.deepEqual(
    nonProgressEvents[0],
    {
      type: 'NO_PROGRESS_DETECTED',
      cycle: 4,
      trajectory: 'CHANGING',
      cause: 'GROWING_ONC_RECURSION',
      goalDepth: 5,
      impasseType: 'ONC',
      currentOperatorId: null,
    },
  )

  console.log(
    'AZ cognitive non-progress integration: OK',
  )
}

void main()
