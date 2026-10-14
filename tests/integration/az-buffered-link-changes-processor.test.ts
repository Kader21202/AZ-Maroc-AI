import assert from 'node:assert/strict'
import { AZBufferedLinkChangesProcessor } from '../../src/engines/cognitive/az/core/decision/AZBufferedLinkChangesProcessor'
import type { AZLinkAdditionProcessor } from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import type { AZLinkRemovalProcessor } from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import type { AZIdentifierPromotionBufferProcessor } from '../../src/engines/cognitive/az/core/decision/AZIdentifierPromotionBufferProcessor'
import type { AZIdentifierDemotionProcessor } from '../../src/engines/cognitive/az/core/decision/AZIdentifierDemotionProcessor'

const calls: string[] = []
let hasPromotion = false
let unknownCount = 0
let disconnectedCount = 0

const additions = {
  hasPendingPromotions(): boolean {
    return hasPromotion
  },
} as AZLinkAdditionProcessor

const removals = {
  getUnknownLevelIdentifiers(): readonly object[] {
    return Array.from({ length: unknownCount }, () => ({}))
  },
  getDisconnectedIdentifiers(): readonly object[] {
    return Array.from({ length: disconnectedCount }, () => ({}))
  },
} as unknown as AZLinkRemovalProcessor

const promotion = {
  processAll(): void {
    calls.push('promotion')
  },
} as AZIdentifierPromotionBufferProcessor

const demotion = {
  process(): void {
    calls.push('demotion')
  },
} as AZIdentifierDemotionProcessor

const processor =
  new AZBufferedLinkChangesProcessor(
    additions,
    removals,
    promotion,
    demotion,
  )

processor.process()

assert.deepEqual(
  calls,
  [],
  'empty buffered-link state must perform no promotion or demotion work',
)

hasPromotion = true
processor.process()

assert.deepEqual(
  calls,
  ['promotion', 'demotion'],
  'pending promotion must trigger promotion before demotion',
)

calls.length = 0
hasPromotion = false
unknownCount = 1
processor.process()

assert.deepEqual(
  calls,
  ['promotion', 'demotion'],
  'unknown-level work must trigger the complete promotion/demotion pass',
)

calls.length = 0
unknownCount = 0
disconnectedCount = 1
processor.process()

assert.deepEqual(
  calls,
  ['promotion', 'demotion'],
  'disconnected work must trigger the complete promotion/demotion pass',
)

console.log(
  'AZ buffered link changes processor: OK',
)
