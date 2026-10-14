import type { CognitiveLineageObservation } from './CognitiveLineageObservation'

export interface CognitiveLineageObservationHandler {
  handle(
    observation: CognitiveLineageObservation,
  ): void
}
