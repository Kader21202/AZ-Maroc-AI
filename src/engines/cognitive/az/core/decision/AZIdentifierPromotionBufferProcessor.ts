import type { AZLinkAdditionProcessor } from './AZLinkAdditionProcessor'
import type { AZIdentifierPromotionProcessor } from './AZIdentifierPromotionProcessor'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'

export interface AZIdentifierPromotionBufferProcessor {
  processAll(): void
}

export class AZDefaultIdentifierPromotionBufferProcessor
  implements AZIdentifierPromotionBufferProcessor
{
  public constructor(
    private readonly linkAdditionProcessor:
      AZLinkAdditionProcessor,

    private readonly promotionProcessor:
      AZIdentifierPromotionProcessor,

    private readonly states:
      AZIdentifierLinkStateRegistry,
  ) {}

  public processAll(): void {
    while (true) {
      const identifier =
        this.linkAdditionProcessor
          .takeNextPromotedIdentifier()

      if (identifier === null) {
        return
      }

      const promotionLevel =
        this.states.get(identifier)
          .promotionLevel

      this.promotionProcessor.promote(
        identifier,
        promotionLevel,
      )
    }
  }
}
