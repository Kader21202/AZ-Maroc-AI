import { strict as assert } from 'node:assert'

import type { CognitiveEvent } from '../../src/engines/cognitive/az/events/CognitiveEvent'
import type { CognitiveEventHandler } from '../../src/engines/cognitive/az/events/CognitiveEventHandler'
import { CognitiveEventProgressMonitor } from '../../src/engines/cognitive/az/monitoring/CognitiveEventProgressMonitor'
import type { CycleObservation } from '../../src/engines/cognitive/az/monitoring/CycleObservation'

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

function observation(
  cycle: number,
  structuralState: string,
  goalDepth: number,
): CycleObservation {
  return {
    cycle,
    currentGoalId: `G${goalDepth}`,
    goalDepth,
    impasseType: 'ONC',
    currentOperatorId: null,
    structuralState,
    outputProduced: false,
    halted: false,
    stopReason: null,
  }
}

function main(): void {
  const eventHandler =
    new RecordingCognitiveEventHandler()

  const monitor =
    new CognitiveEventProgressMonitor(
      eventHandler,
    )

  monitor.handle(
    observation(1, 'A', 1),
  )
  monitor.handle(
    observation(2, 'B', 2),
  )
  monitor.handle(
    observation(3, 'C', 3),
  )

  assert.equal(
    eventHandler.events.length,
    0,
  )

  monitor.handle(
    observation(4, 'D', 4),
  )

  assert.deepEqual(
    eventHandler.events,
    [
      {
        type: 'NO_PROGRESS_DETECTED',
        cycle: 4,
        trajectory: 'CHANGING',
        cause: 'GROWING_ONC_RECURSION',
        goalDepth: 4,
        impasseType: 'ONC',
        currentOperatorId: null,
      },
    ],
  )

  monitor.handle(
    observation(5, 'E', 5),
  )

  assert.equal(
    eventHandler.events.length,
    1,
  )

  monitor.handle({
    ...observation(6, 'F', 6),
    impasseType: null,
    outputProduced: true,
  })

  monitor.handle(
    observation(7, 'G', 7),
  )
  monitor.handle(
    observation(8, 'H', 8),
  )
  monitor.handle(
    observation(9, 'I', 9),
  )
  monitor.handle(
    observation(10, 'J', 10),
  )

  assert.equal(
    eventHandler.events.length,
    2,
  )

  console.log(
    'AZ cognitive non-progress event: OK',
  )
}

main()

