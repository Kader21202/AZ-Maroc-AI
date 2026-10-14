import assert from 'node:assert/strict'

import {
  AZDefaultIdentifierUnknownLevelMarker,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierUnknownLevelMarker'
import type {
  AZIdentifierReferenceProvider,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierReferenceProvider'
import {
  AZDefaultLinkRemovalProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import {
  AZ_ATTRIBUTE_IMPASSE_LEVEL,
} from '../../src/engines/cognitive/az/core/state/AZGoalStackLevel'
import {
  AZDefaultGoalStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import {
  AZDefaultIdentifierLinkStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultImpasseStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import type {
  AZSymbol,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import {
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

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

const root =
  symbols.makeIdentifier('R')

const child =
  symbols.makeIdentifier('C')

const deep =
  symbols.makeIdentifier('D')

const belowStart =
  symbols.makeIdentifier('B')

const secondRoot =
  symbols.makeIdentifier('S')

for (
  const [
    identifier,
    level,
    couldBeALinkFromBelow,
  ] of [
    [root, 3, false],
    [child, 4, false],
    [deep, 5, true],
    [belowStart, 2, false],
    [secondRoot, 6, false],
  ] as const
) {
  states.register(identifier, {
    linkCount: 1,
    level,
    promotionLevel: level,
    couldBeALinkFromBelow,
  })
}

const graph =
  new Map<AZSymbol, readonly AZSymbol[]>([
    [
      root,
      [
        child,
        belowStart,
      ],
    ],
    [
      child,
      [
        deep,
        root,
      ],
    ],
    [
      deep,
      [],
    ],
    [
      belowStart,
      [],
    ],
    [
      secondRoot,
      [
        child,
      ],
    ],
  ])

const references:
  AZIdentifierReferenceProvider = {
    getReferencedIdentifiers(
      identifier: AZSymbol,
    ): readonly AZSymbol[] {
      return graph.get(identifier) ?? []
    },
  }

const marker =
  new AZDefaultIdentifierUnknownLevelMarker(
    references,
    states,
    linkRemovalProcessor,
  )

const first =
  marker.mark(
    root,
    101,
    3,
  )

assert.equal(
  first.highestLevelAnythingCouldFallFrom,
  3,
)

assert.equal(
  first.lowestLevelAnythingCouldFallTo,
  AZ_ATTRIBUTE_IMPASSE_LEVEL,
)

for (
  const identifier of [
    root,
    child,
    deep,
  ]
) {
  assert.equal(
    linkRemovalProcessor
      .getUnknownLevelIdentifiers()
      .includes(identifier),
    true,
  )
}

assert.equal(
  linkRemovalProcessor
    .getUnknownLevelIdentifiers()
    .includes(belowStart),
  false,
)

/*
 * Same traversal number:
 * child was already marked by the first walk,
 * so only secondRoot is new.
 */
const second =
  marker.mark(
    secondRoot,
    101,
    3,
  )

assert.equal(
  second.highestLevelAnythingCouldFallFrom,
  6,
)

assert.equal(
  second.lowestLevelAnythingCouldFallTo,
  6,
)

/*
 * A new traversal number must allow
 * the graph to be visited again.
 */
const third =
  marker.mark(
    root,
    102,
    3,
  )

assert.equal(
  third.highestLevelAnythingCouldFallFrom,
  3,
)

assert.equal(
  third.lowestLevelAnythingCouldFallTo,
  AZ_ATTRIBUTE_IMPASSE_LEVEL,
)

console.log(
  'AZ autonomous identifier unknown-level marker: OK',
)
