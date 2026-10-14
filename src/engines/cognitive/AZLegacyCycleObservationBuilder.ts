import type { CycleObservation } from './az/monitoring/CycleObservation'
import { DefaultStructuralStateCanonicalizer } from './az/monitoring/DefaultStructuralStateCanonicalizer'
import type { StructuralStateCanonicalizer } from './az/monitoring/StructuralStateCanonicalizer'
import type {
  CognitiveImpasseType,
} from './az/events/CognitiveEvent'
import { AZWorkingMemoryStructuralStateExtractor } from './AZWorkingMemoryStructuralStateExtractor'

interface LegacyCycleObservationGoal {
  readonly id: string
  readonly impasseType:
    CognitiveImpasseType | 'NONE'
}

interface LegacyCycleObservationState {
  readonly selectedOperator:
    {
      readonly symbol: {
        readonly id: string
      }
    } | null
}

interface LegacyCycleObservationContext {
  readonly state: LegacyCycleObservationState
  readonly goal: LegacyCycleObservationGoal
  readonly lower:
    LegacyCycleObservationContext | null
}

type LegacyCycleObservationWorkingMemoryView =
  Parameters<
    AZWorkingMemoryStructuralStateExtractor['extract']
  >[0]

interface LegacyCycleObservationRunControl {
  isHalted(): boolean
  reasonForStopping(): string | null
}

interface LegacyCycleObservationStateStack {
  readonly top:
    LegacyCycleObservationContext | null
  readonly bottom:
    LegacyCycleObservationContext | null
}

export class AZLegacyCycleObservationBuilder {
  public constructor(
    private readonly structuralStateExtractor =
      new AZWorkingMemoryStructuralStateExtractor(),

    private readonly structuralStateCanonicalizer:
      StructuralStateCanonicalizer =
        new DefaultStructuralStateCanonicalizer(),
  ) {}

  public build(
    cycle: number,
    stateStack:
      LegacyCycleObservationStateStack,
    workingMemory:
      LegacyCycleObservationWorkingMemoryView,
    runControl:
      LegacyCycleObservationRunControl,
    outputProduced: boolean,
  ): CycleObservation {
    const current =
      stateStack.bottom

    const structuralState =
      this.structuralStateCanonicalizer.canonicalize(
        this.structuralStateExtractor.extract(
          workingMemory,
        ),
      )

    const impasseType =
      current === null ||
      current.goal.impasseType === 'NONE'
        ? null
        : current.goal.impasseType

    return {
      cycle,
      currentGoalId:
        current?.goal.id ?? null,
      goalDepth:
        this.calculateGoalDepth(
          stateStack,
        ),
      impasseType,
      currentOperatorId:
        current?.state.selectedOperator
          ?.symbol.id ?? null,
      structuralState,
      outputProduced,
      halted:
        runControl.isHalted(),
      stopReason:
        runControl.reasonForStopping(),
    }
  }

  private calculateGoalDepth(
    stateStack:
      LegacyCycleObservationStateStack,
  ): number {
    let depth = 0
    let current =
      stateStack.top

    while (current !== null) {
      depth += 1
      current = current.lower
    }

    return depth
  }
}
