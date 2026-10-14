export type CognitiveImpasseType =
  | 'CONSTRAINT_FAILURE'
  | 'CONFLICT'
  | 'TIE'
  | 'NO_CHANGE'
  | 'ONC'
  | 'SNC'

export type CognitiveEvent =
  | {
      readonly type: 'DECISION_CYCLE_COMPLETED'
      readonly cycle: number
    }
  | {
      readonly type: 'OPERATOR_SELECTED'
      readonly operatorId: string
    }
  | {
      readonly type: 'IMPASSE_DETECTED'
      readonly impasseType: CognitiveImpasseType
    }
  | {
      readonly type: 'NO_PROGRESS_DETECTED'
      readonly cycle: number
      readonly trajectory:
        | 'STABLE'
        | 'CHANGING'
        | 'REPEATING'
        | 'OSCILLATING'
      readonly cause:
        | 'STRUCTURAL_STABILITY'
        | 'STRUCTURAL_REPETITION'
        | 'STRUCTURAL_OSCILLATION'
        | 'GROWING_ONC_RECURSION'
      readonly goalDepth: number
      readonly impasseType:
        CognitiveImpasseType | null
      readonly currentOperatorId:
        string | null
    }
  | {
      readonly type: 'OUTPUT_PRODUCED'
    }

