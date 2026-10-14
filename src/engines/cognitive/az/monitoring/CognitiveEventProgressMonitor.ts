import type { CognitiveEventHandler } from '../events/CognitiveEventHandler'
import type { CycleObservation } from './CycleObservation'
import type { CycleObservationHandler } from './CycleObservationHandler'
import { ProgressMonitor } from './ProgressMonitor'

export class CognitiveEventProgressMonitor
  implements CycleObservationHandler
{
  private readonly progressMonitor =
    new ProgressMonitor()

  private nonProgressSignaled = false

  public constructor(
    private readonly cognitiveEventHandler:
      CognitiveEventHandler,
  ) {}

  public handle(
    observation: CycleObservation,
  ): void {
    this.progressMonitor.handle(
      observation,
    )

    if (
      this.progressMonitor
        .getProgressAssessment() !==
        'NO_PROGRESS'
    ) {
      this.nonProgressSignaled = false
      return
    }

    if (this.nonProgressSignaled) {
      return
    }

    const cause =
      this.progressMonitor
        .getNonProgressCause()

    if (cause === null) {
      return
    }

    this.nonProgressSignaled = true

    this.cognitiveEventHandler.handle({
      type: 'NO_PROGRESS_DETECTED',
      cycle: observation.cycle,
      trajectory:
        this.progressMonitor
          .getTrajectoryDynamics(),
      cause,
      goalDepth: observation.goalDepth,
      impasseType: observation.impasseType,
      currentOperatorId:
        observation.currentOperatorId,
    })
  }
}

