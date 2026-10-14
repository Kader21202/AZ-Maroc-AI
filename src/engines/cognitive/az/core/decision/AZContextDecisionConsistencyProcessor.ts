import type { AZContextDecisionConsistencyProcessorPort } from '../cycle/AZElaborationConvergenceRunner'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZMatchSet } from '../production/AZMatchSet'
import type { AZGoalContextStack } from '../state/AZGoalContextStack'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type { AZExistingContextRemover } from '../state/AZExistingContextRemover'
import type { AZContextDecisionConsistencyChecker } from './AZContextDecisionConsistencyChecker'
import type { AZCurrentContextDecisionRemover } from './AZCurrentContextDecisionRemover'
import type { AZWorkingMemoryChangesApplier } from './AZWorkingMemoryChangesApplier'

export class AZContextDecisionConsistencyProcessor
  implements AZContextDecisionConsistencyProcessorPort
{
  public constructor(
    private readonly contextStack:
      AZGoalContextStack,

    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,

    private readonly preferenceMemory:
      AZPreferenceMemory,

    private readonly workingMemory:
      AZWorkingMemory,

    private readonly matchSet:
      AZMatchSet,

    private readonly consistencyChecker:
      AZContextDecisionConsistencyChecker,

    private readonly currentDecisionRemover:
      AZCurrentContextDecisionRemover,

    private readonly existingContextRemover:
      AZExistingContextRemover,

    private readonly workingMemoryChangesApplier:
      AZWorkingMemoryChangesApplier,
  ) {}

  public process(): boolean {
    return this.processUntil(null)
  }

  public processThrough(
    goal: AZSymbol,
  ): boolean {
    return this.processUntil(goal)
  }

  private processUntil(
    stopGoal: AZSymbol | null,
  ): boolean {
    let current =
      this.contextStack.top

    while (current !== null) {
      if (
        this.structuralRegistry.has(
          current.goal,
        )
      ) {
        const structuralState =
          this.structuralRegistry.get(
            current.goal,
          )

        const slot =
          structuralState.operatorSlot

        if (
          slot !== null &&
          slot.changed
        ) {
          const consistency =
            this.consistencyChecker.check(
              current,
              slot,
            )

          if (
            consistency ===
            'INCONSISTENT'
          ) {
            this.currentDecisionRemover.remove(
              current,
              this.workingMemory,
            )

            if (current.lower !== null) {
              this.existingContextRemover.remove(
                current.lower.goal,
                this.workingMemory,
                this.matchSet,
              )
            }

            this.workingMemoryChangesApplier.apply(
              this.preferenceMemory,
              this.workingMemory,
            )

            return true
          }
        }
      }

      if (current.goal === stopGoal) {
        return false
      }

      current = current.lower
    }

    return false
  }
}
