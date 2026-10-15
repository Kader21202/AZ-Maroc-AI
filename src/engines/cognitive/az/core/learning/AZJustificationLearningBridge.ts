import type { AZInstantiation } from '../production/AZInstantiation'
import type { AZCompletedInstantiationHandler } from '../production/AZInstantiationFiringEngine'
import { AZExperientialLearningHandler } from './AZExperientialLearningHandler'

export class AZJustificationLearningBridge
  implements AZCompletedInstantiationHandler {

  private nextLearningId = 1

  public constructor(
    private readonly justificationHandler: AZCompletedInstantiationHandler,
    private readonly learner: AZExperientialLearningHandler,
    private readonly learningEnabled: boolean,
  ) {}

  public handle(
    instantiation: AZInstantiation,
  ): readonly AZInstantiation[] {
    const generated =
      this.justificationHandler.handle(instantiation)

    if (!this.learningEnabled) {
      return generated
    }

    for (const candidate of generated) {
      const production = candidate.production

      if (production === null) {
        continue
      }

      this.learner.learn(
        `az-learn-experience-${this.nextLearningId++}`,
        production,
      )
    }

    return generated
  }
}
