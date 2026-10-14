import type { AZContextSlotWmeRemover } from '../decision/AZContextSlotWmeRemover'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZMatchSet } from '../production/AZMatchSet'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalContext } from './AZGoalContext'
import type { AZGoalContextStack } from './AZGoalContextStack'
import type { AZStateStack } from './AZStateStack'
import type { AZGoalStateRegistry } from './AZGoalStateRegistry'
import type { AZGoalStructuralStateRegistry } from './AZGoalStructuralStateRegistry'
import type { AZImpasseStateRegistry } from './AZImpasseStateRegistry'

export class AZExistingContextRemover {
  public constructor(
    private readonly contextStack:
      AZGoalContextStack,

    private readonly stateStack:
      AZStateStack,

    private readonly preferenceMemory:
      AZPreferenceMemory,

    private readonly contextSlotWmeRemover:
      AZContextSlotWmeRemover,

    private readonly goalStateRegistry:
      AZGoalStateRegistry,

    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,

    private readonly impasseRegistry:
      AZImpasseStateRegistry,
  ) {}

  public remove(
    goal: AZSymbol,
    workingMemory: AZWorkingMemory,
    matchSet: AZMatchSet,
  ): boolean {
    const first =
      this.contextStack.findByGoal(goal)

    if (first === null) {
      return false
    }

    /*
     * Snapshot the branch before cleanup.
     * The stack itself is truncated only
     * after every descendant has been
     * cleaned.
     */
    const branch: AZGoalContext[] = []

    let current: AZGoalContext | null =
      first

    while (current !== null) {
      branch.push(current)
      current = current.lower
    }

    for (
      let index = branch.length - 1;
      index >= 0;
      index -= 1
    ) {
      const context =
        branch[index]

      if (context === undefined) {
        continue
      }

      const currentGoal =
        context.goal

      this.contextStack.truncateFrom(currentGoal)
      this.stateStack.truncateFrom(currentGoal)

      this.preferenceMemory
        .removePreferencesFromGoal(
          currentGoal,
        )

      if (
        this.structuralRegistry.has(
          currentGoal,
        )
      ) {
        const structuralState =
          this.structuralRegistry.get(
            currentGoal,
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

        for (
          const wme of
          structuralState.impasseWmes
        ) {
          workingMemory.scheduleRemove(
            wme,
          )
        }

        structuralState.impasseWmes.length =
          0
      }

      matchSet.transferRetractionsToNilGoal(
        currentGoal,
      )

      this.impasseRegistry.removeImpasse(
        currentGoal,
      )

      this.structuralRegistry.remove(
        currentGoal,
      )

      workingMemory.scheduleAfterBufferedChanges(
        () => {
          this.goalStateRegistry.removeGoal(
            currentGoal,
          )
        },
      )
    }

    return true
  }
}
