import type { AZLinkRemovalProcessor } from './AZLinkRemovalProcessor'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'

export interface AZIdentifierDemotionQueueProcessor {
  moveZeroLinkCountToDisconnected(): void
}

export class AZDefaultIdentifierDemotionQueueProcessor
  implements AZIdentifierDemotionQueueProcessor
{
  public constructor(
    private readonly linkRemovalProcessor:
      AZLinkRemovalProcessor,

    private readonly states:
      AZIdentifierLinkStateRegistry,
  ) {}

  public moveZeroLinkCountToDisconnected(): void {
    const identifiers = [
      ...this.linkRemovalProcessor
        .getUnknownLevelIdentifiers(),
    ]

    for (const identifier of identifiers) {
      const state =
        this.states.get(identifier)

      if (state.linkCount !== 0) {
        continue
      }

      this.linkRemovalProcessor
        .moveUnknownLevelIdentifierToDisconnected(
          identifier,
        )
    }
  }
}
