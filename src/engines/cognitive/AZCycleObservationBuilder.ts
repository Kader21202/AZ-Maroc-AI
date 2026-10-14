import type { CycleObservation } from './az/monitoring/CycleObservation'
import { DefaultStructuralStateCanonicalizer } from './az/monitoring/DefaultStructuralStateCanonicalizer'
import type { StructuralStateCanonicalizer } from './az/monitoring/StructuralStateCanonicalizer'
import type { AZGoalStructuralStateRegistry } from './az/core/state/AZGoalStructuralStateRegistry'
import type { AZSymbol } from './az/core/symbols/AZSymbol'
import { AZWorkingMemoryStructuralStateExtractor } from './AZWorkingMemoryStructuralStateExtractor'

interface CycleObservationContext {
  readonly goal: AZSymbol
  readonly lower:
    CycleObservationContext | null
}

type CycleObservationWorkingMemoryView =
  Parameters<
    AZWorkingMemoryStructuralStateExtractor['extract']
  >[0]

interface CycleObservationRunControl {
  isHalted(): boolean
  reasonForStopping(): string | null
}

interface CycleObservationStateStack {
  readonly top:
    CycleObservationContext | null
  readonly bottom:
    CycleObservationContext | null
}

export class AZCycleObservationBuilder {
  public constructor(
    private readonly structuralStateExtractor =
      new AZWorkingMemoryStructuralStateExtractor(),

    private readonly structuralStateCanonicalizer:
      StructuralStateCanonicalizer =
        new DefaultStructuralStateCanonicalizer(),
  ) {}

  public build(
    cycle: number,
    stateStack: CycleObservationStateStack,
    structuralRegistry:
      AZGoalStructuralStateRegistry,
    workingMemory: CycleObservationWorkingMemoryView,
    runControl: CycleObservationRunControl,
    outputProduced: boolean,
  ): CycleObservation {
    const current =
      stateStack.bottom

    const goal =
      current?.goal ?? null

    const goalStructuralState =
      goal !== null &&
      structuralRegistry.has(goal)
        ? structuralRegistry.get(goal)
        : null

    const structuralState =
      this.structuralStateCanonicalizer.canonicalize(
        this.structuralStateExtractor.extract(
          workingMemory,
        ),
      )

    const impasseType =
      goalStructuralState === null ||
      goalStructuralState.impasseType === 'NONE'
        ? null
        : goalStructuralState.impasseType

    return {
      cycle,
      currentGoalId:
        goal?.id ?? null,
      goalDepth:
        this.calculateGoalDepth(
          stateStack,
        ),
      impasseType,
      currentOperatorId:
        goalStructuralState
          ?.operatorSlot
          ?.wmes[0]
          ?.value.id ?? null,
      structuralState,
      outputProduced,
      halted:
        runControl.isHalted(),
      stopReason:
        runControl.reasonForStopping(),
    }
  }

  private calculateGoalDepth(
    stateStack: CycleObservationStateStack,
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
