import type {
  CognitiveImpasseType,
} from '../events/CognitiveEvent'

export type ContextDecisionObservation =
  | {
      readonly type: 'OPERATOR_SELECTED'
      readonly operatorId: string
    }
  | {
      readonly type: 'IMPASSE_DETECTED'
      readonly impasseType:
        CognitiveImpasseType
    }
