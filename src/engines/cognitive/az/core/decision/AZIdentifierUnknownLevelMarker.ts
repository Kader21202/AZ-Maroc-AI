import type { AZSymbol } from '../symbols/AZSymbol'
import {
  AZ_ATTRIBUTE_IMPASSE_LEVEL,
} from '../state/AZGoalStackLevel'
import type {
  AZIdentifierLinkStateRegistry,
} from '../state/AZIdentifierLinkStateRegistry'
import type {
  AZIdentifierReferenceProvider,
} from './AZIdentifierReferenceProvider'
import type {
  AZLinkRemovalProcessor,
} from './AZLinkRemovalProcessor'

export interface AZIdentifierUnknownLevelMarkResult {
  highestLevelAnythingCouldFallFrom: number
  lowestLevelAnythingCouldFallTo: number
}

export interface AZIdentifierUnknownLevelMarker {
  mark(
    root: AZSymbol,
    markTcNumber: number,
    levelAtWhichMarkingStarted: number,
  ): AZIdentifierUnknownLevelMarkResult
}

export class AZDefaultIdentifierUnknownLevelMarker
  implements AZIdentifierUnknownLevelMarker
{
  private readonly traversalMarks =
    new Map<AZSymbol, number>()

  public constructor(
    private readonly references:
      AZIdentifierReferenceProvider,

    private readonly states:
      AZIdentifierLinkStateRegistry,

    private readonly linkRemovalProcessor:
      AZLinkRemovalProcessor,
  ) {}

  public mark(
    root: AZSymbol,
    markTcNumber: number,
    levelAtWhichMarkingStarted: number,
  ): AZIdentifierUnknownLevelMarkResult {
    const identifiersToWalk: AZSymbol[] = [
      root,
    ]

    let highestLevelAnythingCouldFallFrom =
      AZ_ATTRIBUTE_IMPASSE_LEVEL

    let lowestLevelAnythingCouldFallTo =
      -1

    while (identifiersToWalk.length > 0) {
      const identifier =
        identifiersToWalk.pop()

      if (identifier === undefined) {
        continue
      }

      if (
        this.traversalMarks.get(identifier) ===
        markTcNumber
      ) {
        continue
      }

      const state =
        this.states.get(identifier)

      if (
        state.level <
        levelAtWhichMarkingStarted
      ) {
        continue
      }

      this.traversalMarks.set(
        identifier,
        markTcNumber,
      )

      if (
        state.level <
        highestLevelAnythingCouldFallFrom
      ) {
        highestLevelAnythingCouldFallFrom =
          state.level
      }

      if (
        state.level >
        lowestLevelAnythingCouldFallTo
      ) {
        lowestLevelAnythingCouldFallTo =
          state.level
      }

      if (state.couldBeALinkFromBelow) {
        lowestLevelAnythingCouldFallTo =
          AZ_ATTRIBUTE_IMPASSE_LEVEL
      }

      this.linkRemovalProcessor
        .addUnknownLevelIdentifier(
          identifier,
        )

      for (
        const referencedIdentifier of
          this.references
            .getReferencedIdentifiers(
              identifier,
            )
      ) {
        identifiersToWalk.push(
          referencedIdentifier,
        )
      }
    }

    return {
      highestLevelAnythingCouldFallFrom,
      lowestLevelAnythingCouldFallTo,
    }
  }
}
