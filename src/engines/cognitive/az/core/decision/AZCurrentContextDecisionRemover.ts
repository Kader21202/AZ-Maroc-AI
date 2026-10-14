import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZGoalContext } from '../state/AZGoalContext'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type { AZContextSlotWmeRemover } from './AZContextSlotWmeRemover'

export class AZCurrentContextDecisionRemover {
  public constructor(
    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,

    private readonly contextSlotWmeRemover:
      AZContextSlotWmeRemover,
  ) {}

  public remove(
    context: AZGoalContext,
    workingMemory: AZWorkingMemory,
  ): void {
    if (
      !this.structuralRegistry.has(
        context.goal,
      )
    ) {
      return
    }

    const structuralState =
      this.structuralRegistry.get(
        context.goal,
      )

    if (
      structuralState.operatorSlot !==
      null
    ) {
      this.contextSlotWmeRemover.remove(
        structuralState.operatorSlot,
        workingMemory,
      )
    }
  }
}
