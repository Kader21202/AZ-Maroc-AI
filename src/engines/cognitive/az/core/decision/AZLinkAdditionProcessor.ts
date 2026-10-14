import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalStateRegistry } from '../state/AZGoalStateRegistry'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZImpasseStateRegistry } from '../state/AZImpasseStateRegistry'

export interface AZLinkAdditionProcessor {
  post(
    from: AZSymbol | null,
    to: AZSymbol,
  ): void

  hasPendingPromotions(): boolean

  takeNextPromotedIdentifier():
    AZSymbol | null
}

export class AZDefaultLinkAdditionProcessor
  implements AZLinkAdditionProcessor
{
  private readonly promotedIdentifiers:
    AZSymbol[] = []

  public constructor(
    private readonly states:
      AZIdentifierLinkStateRegistry,

    private readonly goals:
      AZGoalStateRegistry,

    private readonly impasses:
      AZImpasseStateRegistry,
  ) {}

  public post(
    from: AZSymbol | null,
    to: AZSymbol,
  ): void {
    if (
      from !== null &&
      (
        this.goals.isGoal(to) ||
        this.impasses.isImpasse(to)
      )
    ) {
      return
    }

    const toState =
      this.states.get(to)

    toState.linkCount += 1

    if (from === null) {
      return
    }

    const fromState =
      this.states.get(from)

    if (
      fromState.promotionLevel ===
      toState.promotionLevel
    ) {
      return
    }

    if (
      fromState.promotionLevel >
      toState.promotionLevel
    ) {
      toState.couldBeALinkFromBelow = true
      return
    }

    toState.promotionLevel =
      fromState.promotionLevel

    this.promotedIdentifiers.push(to)
  }

  public hasPendingPromotions(): boolean {
    return (
      this.promotedIdentifiers.length >
      0
    )
  }

  public takeNextPromotedIdentifier():
    AZSymbol | null {
    return (
      this.promotedIdentifiers.shift() ??
      null
    )
  }
}
