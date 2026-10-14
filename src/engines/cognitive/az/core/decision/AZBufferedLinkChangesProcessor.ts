import type { AZIdentifierDemotionProcessor } from './AZIdentifierDemotionProcessor'
import type { AZIdentifierPromotionBufferProcessor } from './AZIdentifierPromotionBufferProcessor'
import type { AZLinkAdditionProcessor } from './AZLinkAdditionProcessor'
import type { AZLinkRemovalProcessor } from './AZLinkRemovalProcessor'

export class AZBufferedLinkChangesProcessor {
  public constructor(
    private readonly linkAdditionProcessor:
      AZLinkAdditionProcessor,

    private readonly linkRemovalProcessor:
      AZLinkRemovalProcessor,

    private readonly promotionProcessor:
      AZIdentifierPromotionBufferProcessor,

    private readonly demotionProcessor:
      AZIdentifierDemotionProcessor,
  ) {}

  public process(): void {
    const hasPromotion =
      this.linkAdditionProcessor
        .hasPendingPromotions()

    const hasUnknown =
      this.linkRemovalProcessor
        .getUnknownLevelIdentifiers()
        .length > 0

    const hasDisconnected =
      this.linkRemovalProcessor
        .getDisconnectedIdentifiers()
        .length > 0

    if (
      !hasPromotion &&
      !hasUnknown &&
      !hasDisconnected
    ) {
      return
    }

    this.promotionProcessor
      .processAll()

    this.demotionProcessor
      .process()
  }
}
