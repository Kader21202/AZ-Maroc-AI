import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZGoalStateRegistry } from '../state/AZGoalStateRegistry'
import type { AZImpasseStateRegistry } from '../state/AZImpasseStateRegistry'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZIdentifierReferenceProvider } from './AZIdentifierReferenceProvider'

export interface AZIdentifierPromotionProcessor {
  promote(
    identifier: AZSymbol,
    newLevel: number,
  ): void
}

export class AZDefaultIdentifierPromotionProcessor
  implements AZIdentifierPromotionProcessor
{
  public constructor(
    private readonly states:
      AZIdentifierLinkStateRegistry,

    private readonly goals:
      AZGoalStateRegistry,

    private readonly impasses:
      AZImpasseStateRegistry,

    private readonly references:
      AZIdentifierReferenceProvider,
  ) {}

  public promote(
    identifier: AZSymbol,
    newLevel: number,
  ): void {
    const state =
      this.states.get(identifier)

    if (state.level <= newLevel) {
      return
    }

    if (
      state.promotionLevel < newLevel
    ) {
      return
    }

    state.level = newLevel
    state.promotionLevel = newLevel
    state.couldBeALinkFromBelow = true

    if (
      this.goals.isGoal(identifier) ||
      this.impasses.isImpasse(identifier)
    ) {
      throw new Error(
        'Cannot promote a goal or impasse identifier',
      )
    }

    for (
      const referenced of
        this.references
          .getReferencedIdentifiers(
            identifier,
          )
    ) {
      this.promote(
        referenced,
        newLevel,
      )
    }
  }
}
