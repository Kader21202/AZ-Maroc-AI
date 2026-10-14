import type {
  ContextDecisionObservation,
} from './ContextDecisionObservation'

export interface ContextDecisionObserver {
  observe(
    observation: ContextDecisionObservation,
  ): void
}
