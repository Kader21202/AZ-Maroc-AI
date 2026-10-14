import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZMatchSet } from '../production/AZMatchSet'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZContextChangeTracker } from '../state/AZContextChangeTracker'
import type { AZGoalContext } from '../state/AZGoalContext'
import type { AZGoalContextStack } from '../state/AZGoalContextStack'
import type { AZContextSlotDecidability } from './AZContextSlotDecidability'
import type { AZContextSlotDecider } from './AZContextSlotDecider'

export class AZContextSlotsDecider {
  public constructor(
    private readonly contextStack:
      AZGoalContextStack,

    private readonly contextChangeTracker:
      AZContextChangeTracker,

    private readonly predefinedSymbols:
      AZPredefinedSymbols,

    private readonly contextSlotDecidability:
      AZContextSlotDecidability,

    private readonly contextSlotDecider:
      AZContextSlotDecider,
  ) {}

  public decideAll(
    preferenceMemory: AZPreferenceMemory,
    workingMemory: AZWorkingMemory,
    matchSet: AZMatchSet,
  ): void {
    let context =
      this.getStartingContext()

    if (context === null) {
      this.contextChangeTracker.clear()
      return
    }

    for (;;) {
      const slot =
        preferenceMemory.getSlot(
          context.goal,
          this.predefinedSymbols.operator,
        )

      if (slot === null) {
        throw new Error(
          'Goal context is missing its operator slot',
        )
      }

      if (!slot.isaContextSlot) {
        throw new Error(
          'Goal operator slot must be a context slot',
        )
      }

      if (
        !this.contextSlotDecidability
          .isDecidable(slot) &&
        context.lower !== null
      ) {
        context = context.lower
        continue
      }

      const decisionChanged =
        this.contextSlotDecidability
          .isDecidable(slot)
          ? this.contextSlotDecider.decide(
              slot,
              workingMemory,
              matchSet,
            )
          : this.contextSlotDecider
              .decideWithResult(
                slot,
                workingMemory,
                matchSet,
                {
                  impasseType: 'NO_CHANGE',
                  candidates: [],
                },
                true,
              )

      slot.changed = false

      if (decisionChanged) {
        break
      }

      if (context.lower === null) {
        break
      }

      context = context.lower
    }

    this.contextChangeTracker.clear()
  }

  private getStartingContext():
    AZGoalContext | null {
    const changedGoal =
      this.contextChangeTracker
        .highestGoalWhoseContextChanged

    if (changedGoal === null) {
      return this.contextStack.bottom
    }

    const context =
      this.contextStack.findByGoal(
        changedGoal,
      )

    if (context === null) {
      throw new Error(
        'Changed context goal does not belong to the goal stack',
      )
    }

    return context
  }
}
