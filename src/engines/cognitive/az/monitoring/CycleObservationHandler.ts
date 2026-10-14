import type { CycleObservation } from './CycleObservation'

export interface CycleObservationHandler {
  handle(
    observation: CycleObservation,
  ): void
}
