import type {
  AZIdentifierDemotionQueueProcessor,
} from './AZIdentifierDemotionQueueProcessor'
import type {
  AZIdentifierGarbageCollector,
} from './AZIdentifierGarbageCollector'
import type {
  AZIdentifierLevelWalker,
} from './AZIdentifierLevelWalker'
import type {
  AZIdentifierUnknownLevelMarker,
} from './AZIdentifierUnknownLevelMarker'
import type {
  AZLinkRemovalProcessor,
} from './AZLinkRemovalProcessor'
import type {
  AZTransitiveClosureNumberGenerator,
} from './AZTransitiveClosureNumberGenerator'
import {
  AZ_ATTRIBUTE_IMPASSE_LEVEL,
} from '../state/AZGoalStackLevel'
import type {
  AZGoalStateRegistry,
} from '../state/AZGoalStateRegistry'
import type {
  AZIdentifierLinkStateRegistry,
} from '../state/AZIdentifierLinkStateRegistry'
import type {
  AZStateStack,
} from '../state/AZStateStack'

export interface AZIdentifierDemotionProcessor {
  process(): void
}

export class AZDefaultIdentifierDemotionProcessor
  implements AZIdentifierDemotionProcessor
{
  public constructor(
    private readonly queueProcessor:
      AZIdentifierDemotionQueueProcessor,

    private readonly garbageCollector:
      AZIdentifierGarbageCollector,

    private readonly marker:
      AZIdentifierUnknownLevelMarker,

    private readonly walker:
      AZIdentifierLevelWalker,

    private readonly linkRemovalProcessor:
      AZLinkRemovalProcessor,

    private readonly tcGenerator:
      AZTransitiveClosureNumberGenerator,

    private readonly stateStack:
      AZStateStack,

    private readonly goalStates:
      AZGoalStateRegistry,

    private readonly identifierStates:
      AZIdentifierLinkStateRegistry,
  ) {}

  public process(): void {
    this.queueProcessor
      .moveZeroLinkCountToDisconnected()

    this.linkRemovalProcessor
      .setLinkUpdateMode(
        'UPDATE_DISCONNECTED_IDS_LIST',
      )

    while (true) {
      const identifier =
        this.linkRemovalProcessor
          .takeNextDisconnectedIdentifier()

      if (identifier === null) {
        break
      }

      this.garbageCollector.collect(
        identifier,
      )
    }

    this.linkRemovalProcessor
      .setLinkUpdateMode(
        'UPDATE_LINKS_NORMALLY',
      )

    const unknownIdentifiers = [
      ...this.linkRemovalProcessor
        .getUnknownLevelIdentifiers(),
    ]

    if (unknownIdentifiers.length === 0) {
      return
    }

    const markTcNumber =
      this.tcGenerator.next()

    let highestLevelAnythingCouldFallFrom =
      AZ_ATTRIBUTE_IMPASSE_LEVEL

    let lowestLevelAnythingCouldFallTo =
      -1

    for (
      const identifier of
        unknownIdentifiers
    ) {
      const identifierLevel =
        this.identifierStates
          .get(identifier)
          .level

      const result =
        this.marker.mark(
          identifier,
          markTcNumber,
          identifierLevel,
        )

      if (
        result.highestLevelAnythingCouldFallFrom <
        highestLevelAnythingCouldFallFrom
      ) {
        highestLevelAnythingCouldFallFrom =
          result.highestLevelAnythingCouldFallFrom
      }

      if (
        result.lowestLevelAnythingCouldFallTo >
        lowestLevelAnythingCouldFallTo
      ) {
        lowestLevelAnythingCouldFallTo =
          result.lowestLevelAnythingCouldFallTo
      }
    }

    let current =
      this.stateStack.top

    while (current !== null) {
      const goal =
        current.goal

      const goalLevel =
        this.goalStates.getLevel(goal)

      if (
        goalLevel >
        lowestLevelAnythingCouldFallTo
      ) {
        break
      }

      if (
        goalLevel >=
        highestLevelAnythingCouldFallFrom
      ) {
        const walkTcNumber =
          this.tcGenerator.next()

        this.walker.walk(
          goal,
          walkTcNumber,
          goalLevel,
        )
      }

      current =
        current.lower
    }

    this.linkRemovalProcessor
      .setLinkUpdateMode(
        'JUST_UPDATE_COUNT',
      )

    while (true) {
      const identifier =
        this.linkRemovalProcessor
          .takeNextUnknownLevelIdentifier()

      if (identifier === null) {
        break
      }

      this.garbageCollector.collect(
        identifier,
      )
    }

    this.linkRemovalProcessor
      .setLinkUpdateMode(
        'UPDATE_LINKS_NORMALLY',
      )
  }
}
