import type { CognitiveEventHandler } from '../events/CognitiveEventHandler'
import type { ContextDecisionObservation } from './ContextDecisionObservation'
import type { ContextDecisionObserver } from './ContextDecisionObserver'

export class CognitiveEventContextDecisionObserver
  implements ContextDecisionObserver
{
  public constructor(
    private readonly cognitiveEventHandler:
      CognitiveEventHandler,
  ) {}

  public observe(
    observation: ContextDecisionObservation,
  ): void {
    this.cognitiveEventHandler.handle(
      observation,
    )
  }
}
