import assert from 'node:assert/strict'

import {
  AZDefaultIdentifierDemotionQueueProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierDemotionQueueProcessor'
import {
  AZDefaultLinkRemovalProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import {
  AZDefaultGoalStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import {
  AZDefaultIdentifierLinkStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultImpasseStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()

const states =
  new AZDefaultIdentifierLinkStateRegistry()

const goals =
  new AZDefaultGoalStateRegistry()

const impasses =
  new AZDefaultImpasseStateRegistry()

const linkRemovalProcessor =
  new AZDefaultLinkRemovalProcessor(
    states,
    goals,
    impasses,
  )

const processor =
  new AZDefaultIdentifierDemotionQueueProcessor(
    linkRemovalProcessor,
    states,
  )

const disconnected =
  symbols.makeIdentifier('D')

const stillConnected =
  symbols.makeIdentifier('C')

const secondDisconnected =
  symbols.makeIdentifier('E')

states.register(disconnected, {
  linkCount: 0,
  level: 2,
  promotionLevel: 2,
})

states.register(stillConnected, {
  linkCount: 1,
  level: 2,
  promotionLevel: 2,
})

states.register(secondDisconnected, {
  linkCount: 0,
  level: 3,
  promotionLevel: 3,
})

linkRemovalProcessor
  .addUnknownLevelIdentifier(
    disconnected,
  )

linkRemovalProcessor
  .addUnknownLevelIdentifier(
    stillConnected,
  )

linkRemovalProcessor
  .addUnknownLevelIdentifier(
    secondDisconnected,
  )

processor.moveZeroLinkCountToDisconnected()

assert.equal(
  linkRemovalProcessor
    .getUnknownLevelIdentifiers()
    .includes(disconnected),
  false,
)

assert.equal(
  linkRemovalProcessor
    .getUnknownLevelIdentifiers()
    .includes(secondDisconnected),
  false,
)

assert.equal(
  linkRemovalProcessor
    .getUnknownLevelIdentifiers()
    .includes(stillConnected),
  true,
)

assert.equal(
  linkRemovalProcessor
    .getDisconnectedIdentifiers()
    .includes(disconnected),
  true,
)

assert.equal(
  linkRemovalProcessor
    .getDisconnectedIdentifiers()
    .includes(secondDisconnected),
  true,
)

assert.equal(
  linkRemovalProcessor
    .getDisconnectedIdentifiers()
    .includes(stillConnected),
  false,
)

// Running the queue processor again must
// remain stable and must not duplicate entries.
const disconnectedCount =
  linkRemovalProcessor
    .getDisconnectedIdentifiers()
    .length

processor.moveZeroLinkCountToDisconnected()

assert.equal(
  linkRemovalProcessor
    .getDisconnectedIdentifiers()
    .length,
  disconnectedCount,
)

console.log(
  'AZ autonomous identifier demotion queue: OK',
)
