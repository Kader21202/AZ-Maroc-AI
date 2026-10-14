import type {
  CognitiveImpasseType,
} from '../events/CognitiveEvent'

export interface CycleObservation {
  readonly cycle: number

  readonly currentGoalId: string | null

  readonly goalDepth: number

  readonly impasseType:
    CognitiveImpasseType | null

  readonly currentOperatorId:
    string | null

  readonly structuralState: string

  readonly outputProduced: boolean

  readonly halted: boolean

  readonly stopReason: string | null
}
