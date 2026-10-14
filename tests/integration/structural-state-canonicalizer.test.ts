import assert from 'node:assert/strict'

import { DefaultStructuralStateCanonicalizer } from '../../src/engines/cognitive/az/monitoring/DefaultStructuralStateCanonicalizer'
import type { StructuralStateObservation } from '../../src/engines/cognitive/az/monitoring/StructuralStateObservation'

function createFirstObservation(): StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-1',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'child',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-2',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-2',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'name',
        },
        value: {
          type: 'STRING_CONSTANT',
          value: 'alpha',
        },
        acceptable: false,
      },
    ],
  }
}

function createEquivalentObservationWithDifferentTechnicalIds():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-41',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'child',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-99',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-99',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'name',
        },
        value: {
          type: 'STRING_CONSTANT',
          value: 'alpha',
        },
        acceptable: false,
      },
    ],
  }
}

function main(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const first =
    canonicalizer.canonicalize(
      createFirstObservation(),
    )

  const second =
    canonicalizer.canonicalize(
      createEquivalentObservationWithDifferentTechnicalIds(),
    )

  assert.equal(
    first,
    second,
  )

  console.log(
    'AZ structural-state technical identity invariance: OK',
  )
}

main()

function createEquivalentObservationWithDifferentElementOrder():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'node-B',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'name',
        },
        value: {
          type: 'STRING_CONSTANT',
          value: 'alpha',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'node-A',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'child',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'node-B',
        },
        acceptable: false,
      },
    ],
  }
}

function testElementOrderInvariance(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const first =
    canonicalizer.canonicalize(
      createFirstObservation(),
    )

  const second =
    canonicalizer.canonicalize(
      createEquivalentObservationWithDifferentElementOrder(),
    )

  assert.equal(
    first,
    second,
  )
}

testElementOrderInvariance()

function createChangedObservation():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-1',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'child',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-2',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-2',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'name',
        },
        value: {
          type: 'STRING_CONSTANT',
          value: 'beta',
        },
        acceptable: false,
      },
    ],
  }
}

function testStructuralChangeDetection(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const first =
    canonicalizer.canonicalize(
      createFirstObservation(),
    )

  const changed =
    canonicalizer.canonicalize(
      createChangedObservation(),
    )

  assert.notEqual(
    first,
    changed,
  )
}

testStructuralChangeDetection()

function createAcceptableChangedObservation():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-1',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'child',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-2',
        },
        acceptable: true,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'symbol-2',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'name',
        },
        value: {
          type: 'STRING_CONSTANT',
          value: 'alpha',
        },
        acceptable: false,
      },
    ],
  }
}

function testAcceptableDifference(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const first =
    canonicalizer.canonicalize(
      createFirstObservation(),
    )

  const changed =
    canonicalizer.canonicalize(
      createAcceptableChangedObservation(),
    )

  assert.notEqual(
    first,
    changed,
  )
}

testAcceptableDifference()

function createSharedReferenceObservation():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'root',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'left',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'shared',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'root',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'right',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'shared',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'shared',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'name',
        },
        value: {
          type: 'STRING_CONSTANT',
          value: 'alpha',
        },
        acceptable: false,
      },
    ],
  }
}

function createDuplicatedReferenceObservation():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'root',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'left',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'left-child',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'root',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'right',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'right-child',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'left-child',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'name',
        },
        value: {
          type: 'STRING_CONSTANT',
          value: 'alpha',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'right-child',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'name',
        },
        value: {
          type: 'STRING_CONSTANT',
          value: 'alpha',
        },
        acceptable: false,
      },
    ],
  }
}

function testSharedReferencePreservation(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const shared =
    canonicalizer.canonicalize(
      createSharedReferenceObservation(),
    )

  const duplicated =
    canonicalizer.canonicalize(
      createDuplicatedReferenceObservation(),
    )

  assert.notEqual(
    shared,
    duplicated,
  )
}

testSharedReferencePreservation()

function createCyclicObservation():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'node-A',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'next',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'node-B',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'node-B',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'next',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'node-A',
        },
        acceptable: false,
      },
    ],
  }
}

function createEquivalentCyclicObservation():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'x2',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'next',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'x1',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'x1',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'next',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'x2',
        },
        acceptable: false,
      },
    ],
  }
}

function testCycleInvariance(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const first =
    canonicalizer.canonicalize(
      createCyclicObservation(),
    )

  const second =
    canonicalizer.canonicalize(
      createEquivalentCyclicObservation(),
    )

  assert.equal(
    first,
    second,
  )
}

testCycleInvariance()

function testRevisitedStateStability(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const observation =
    createFirstObservation()

  const first =
    canonicalizer.canonicalize(
      observation,
    )

  const revisited =
    canonicalizer.canonicalize(
      observation,
    )

  assert.equal(
    first,
    revisited,
  )
}

testRevisitedStateStability()

function createSymmetricPairObservation():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'root',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'left',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'a',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'root',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'right',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'b',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'a',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'peer',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'b',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'b',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'peer',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'a',
        },
        acceptable: false,
      },
    ],
  }
}

function createNonEquivalentSymmetricObservation():
  StructuralStateObservation {
  return {
    elements: [
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'root',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'left',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'a',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'root',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'right',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'b',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'a',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'peer',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'a',
        },
        acceptable: false,
      },
      {
        identifier: {
          type: 'IDENTIFIER',
          technicalId: 'b',
        },
        attribute: {
          type: 'STRING_CONSTANT',
          value: 'peer',
        },
        value: {
          type: 'IDENTIFIER',
          technicalId: 'b',
        },
        acceptable: false,
      },
    ],
  }
}

function testSymmetricTopologyDifference(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const first =
    canonicalizer.canonicalize(
      createSymmetricPairObservation(),
    )

  const second =
    canonicalizer.canonicalize(
      createNonEquivalentSymmetricObservation(),
    )

  assert.notEqual(
    first,
    second,
  )
}

testSymmetricTopologyDifference()

function createSixNodeCycleObservation():
  StructuralStateObservation {
  const nodes =
    ['a', 'b', 'c', 'd', 'e', 'f']

  return {
    elements: nodes.map(
      (node, index) => ({
        identifier: {
          type: 'IDENTIFIER' as const,
          technicalId: node,
        },
        attribute: {
          type: 'STRING_CONSTANT' as const,
          value: 'next',
        },
        value: {
          type: 'IDENTIFIER' as const,
          technicalId:
            nodes[
              (index + 1) %
              nodes.length
            ],
        },
        acceptable: false,
      }),
    ),
  }
}

function createTwoThreeNodeCyclesObservation():
  StructuralStateObservation {
  const edges: readonly [
    string,
    string,
  ][] = [
    ['a', 'b'],
    ['b', 'c'],
    ['c', 'a'],
    ['d', 'e'],
    ['e', 'f'],
    ['f', 'd'],
  ]

  return {
    elements: edges.map(
      ([from, to]) => ({
        identifier: {
          type: 'IDENTIFIER' as const,
          technicalId: from,
        },
        attribute: {
          type: 'STRING_CONSTANT' as const,
          value: 'next',
        },
        value: {
          type: 'IDENTIFIER' as const,
          technicalId: to,
        },
        acceptable: false,
      }),
    ),
  }
}

function testGlobalTopologyDifference(): void {
  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  const singleCycle =
    canonicalizer.canonicalize(
      createSixNodeCycleObservation(),
    )

  const twoCycles =
    canonicalizer.canonicalize(
      createTwoThreeNodeCyclesObservation(),
    )

  assert.notEqual(
    singleCycle,
    twoCycles,
  )
}

testGlobalTopologyDifference()
