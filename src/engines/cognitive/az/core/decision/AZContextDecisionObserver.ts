import type { AZImpasseType } from './AZImpasseType'

export type AZObservedContextImpasseType =
  Exclude<
    AZImpasseType,
    'NONE' | 'NO_CHANGE'
  >

export type AZContextDecisionObservation =
  | {
      readonly type: 'OPERATOR_SELECTED'
      readonly operatorId: string
    }
  | {
      readonly type: 'IMPASSE_DETECTED'
      readonly impasseType:
        AZObservedContextImpasseType
    }

export interface AZContextDecisionObserver {
  observe(
    observation: AZContextDecisionObservation,
  ): void
}
