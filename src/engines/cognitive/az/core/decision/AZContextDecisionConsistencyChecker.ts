import type { AZContextPreferenceSemantics } from './AZContextPreferenceSemantics'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZGoalContext } from '../state/AZGoalContext'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type { AZImpasseType } from './AZImpasseType'

export type AZContextDecisionConsistency =
  | 'NO_CURRENT_DECISION'
  | 'CONSISTENT'
  | 'INCONSISTENT'

export class AZContextDecisionConsistencyChecker {
  public constructor(
    private readonly contextPreferenceSemantics:
      AZContextPreferenceSemantics,

    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,
  ) {}

  public check(
    context: AZGoalContext,
    slot: AZPreferenceSlot,
  ): AZContextDecisionConsistency {
    if (!slot.isaContextSlot) {
      throw new Error(
        'Context decision consistency requires a context slot',
      )
    }

    const currentWme =
      slot.wmes[0]

    const lower =
      context.lower

    if (
      currentWme === undefined &&
      lower === null
    ) {
      return 'NO_CURRENT_DECISION'
    }

    if (!slot.changed) {
      return 'CONSISTENT'
    }

    let currentImpasseType:
      AZImpasseType = 'NONE'

    if (
      lower !== null &&
      this.structuralRegistry.has(
        lower.goal,
      )
    ) {
      currentImpasseType =
        this.structuralRegistry.get(
          lower.goal,
        ).impasseType
    }

    /*
     * An installed operator accompanied by an
     * operator no-change subcontext is compared
     * as an installed decision.
     */
    if (
      currentWme !== undefined &&
      currentImpasseType === 'NO_CHANGE'
    ) {
      currentImpasseType = 'NONE'
    }

    const result =
      this.contextPreferenceSemantics
        .evaluate(slot)

    if (
      currentImpasseType !==
      result.impasseType
    ) {
      return 'INCONSISTENT'
    }

    if (
      result.impasseType !== 'NONE'
    ) {
      return 'CONSISTENT'
    }

    if (currentWme !== undefined) {
      const stillCandidate =
        result.candidates.some(
          candidate =>
            candidate.value ===
            currentWme.value,
        )

      return stillCandidate
        ? 'CONSISTENT'
        : 'INCONSISTENT'
    }

    if (lower !== null) {
      return 'INCONSISTENT'
    }

    return 'NO_CURRENT_DECISION'
  }
}
