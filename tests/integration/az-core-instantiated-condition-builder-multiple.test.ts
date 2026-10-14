import assert from 'node:assert/strict'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiatedConditionBuilder'
import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import type { AZMemoryNode } from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const positiveCondition = (suffix: string) => ({
  type: 'POSITIVE' as const,
  identifierTest: {
    type: 'EQUALITY' as const,
    referent: symbol(`I${suffix}`),
  },
  attributeTest: {
    type: 'EQUALITY' as const,
    referent: symbol(`A${suffix}`),
  },
  valueTest: {
    type: 'EQUALITY' as const,
    referent: symbol(`V${suffix}`),
  },
  acceptable: false,
})

const firstCondition = positiveCondition('1')
const secondCondition = positiveCondition('2')

const production: AZProduction = {
  name: 'multi-condition-test',
  declaredSupport: 'UNDECLARED',
  conditions: [
    firstCondition,
    secondCondition,
  ],
  actions: [],
  instantiations: [],
}

const alphaMemory =
  new AZAlphaMemory(
    1,
    null,
    null,
    null,
    false,
  )

const firstPositive: AZPositiveNode = {
  type: 'POSITIVE',
  nodeId: 1,
  parent: null,
  children: [],
  alphaMemory,
  tests: [],
  leftUnlinked: false,
  rightUnlinked: false,
}

const memory: AZMemoryNode = {
  type: 'MEMORY',
  nodeId: 2,
  parent: firstPositive,
  children: [],
  leftHashFieldNumber: null,
  leftHashLevelsUp: null,
  tokens: [],
}

const secondPositive: AZPositiveNode = {
  type: 'POSITIVE',
  nodeId: 3,
  parent: memory,
  children: [],
  alphaMemory,
  tests: [],
  leftUnlinked: false,
  rightUnlinked: false,
}

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 4,
  parent: secondPositive,
  children: [],
  production,
  tokens: [],
}

const wme1: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: symbol('S1'),
  attribute: symbol('A1'),
  value: symbol('V1'),
  acceptable: false,
}

const wme2: AZWorkingMemoryElement = {
  timetag: 2,
  identifier: symbol('S2'),
  attribute: symbol('A2'),
  value: symbol('V2'),
  acceptable: false,
}

const token: AZToken = {
  parent: null,
  workingMemoryElement: wme1,
  node: memory,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const builder =
  new AZDefaultInstantiatedConditionBuilder(
    new AZDefaultReteParentResolver(),
  )

const result =
  builder.build(
    production,
    productionNode,
    token,
    wme2,
  )

assert.equal(result.length, 2)

assert.equal(result[0]?.type, 'POSITIVE')
assert.equal(result[1]?.type, 'POSITIVE')

if (
  result[0]?.type !== 'POSITIVE' ||
  result[1]?.type !== 'POSITIVE'
) {
  throw new Error(
    'Expected two positive instantiated conditions',
  )
}

assert.equal(
  result[0].sourceCondition,
  firstCondition,
)

assert.equal(
  result[1].sourceCondition,
  secondCondition,
)

assert.equal(
  result[0].workingMemoryElement,
  wme1,
)

assert.equal(
  result[1].workingMemoryElement,
  wme2,
)

console.log(
  'AZ core multi-condition RETE reconstruction: OK',
)

/*
 * Historical RETE reconstruction regressions.
 * These protect paths where a positive condition is represented by an MP
 * and where a split MP is followed by MEMORY -> POSITIVE.
 */
{
  const factory = new AZDefaultReteNodeFactory()
  const pathBuilder =
    new AZDefaultInstantiatedConditionBuilder(
      new AZDefaultReteParentResolver(),
    )

  const root = factory.createDummyTopNode()
  const location = {
    levelsUp: 0,
    fieldNumber: 0 as const,
  }

  const positiveAlpha =
    new AZAlphaMemory(
      101,
      null,
      null,
      null,
      false,
    )

  const negativeAlpha =
    new AZAlphaMemory(
      102,
      null,
      null,
      null,
      false,
    )

  const positive = positiveCondition('mp-negative')
  const negative = {
    type: 'NEGATIVE' as const,
    identifierTest: positive.identifierTest,
    attributeTest: positive.attributeTest,
    valueTest: positive.valueTest,
    acceptable: false,
  }

  const mpNegativeProduction: AZProduction = {
    name: 'mp-negative-reconstruction',
    declaredSupport: 'O_SUPPORT',
    conditions: [positive, negative],
    actions: [],
    instantiations: [],
  }

  const positiveWme: AZWorkingMemoryElement = {
    timetag: 101,
    identifier: symbol('S-mp-negative'),
    attribute: symbol('A-mp-negative'),
    value: symbol('V-mp-negative'),
    acceptable: false,
  }

  const mp =
    factory.createMpNode(
      root,
      false,
      location,
      positiveAlpha,
      [],
    )

  const negativeNode =
    factory.createNegativeNode(
      mp,
      false,
      location,
      negativeAlpha,
      [],
    )

  const mpNegativeProductionNode =
    factory.createProductionNode(
      negativeNode,
      mpNegativeProduction,
    )

  const mpToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: mp,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const negativeToken: AZToken = {
    parent: mpToken,
    workingMemoryElement: positiveWme,
    node: negativeNode,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  mpToken.children.push(negativeToken)

  const mpNegativeResult =
    pathBuilder.build(
      mpNegativeProduction,
      mpNegativeProductionNode,
      negativeToken,
      null,
    )

  assert.equal(mpNegativeResult.length, 2)
  assert.equal(mpNegativeResult[0]?.type, 'POSITIVE')
  assert.equal(mpNegativeResult[1]?.type, 'NEGATIVE')

  if (
    mpNegativeResult[0]?.type !== 'POSITIVE' ||
    mpNegativeResult[1]?.type !== 'NEGATIVE'
  ) {
    throw new Error(
      'Expected POSITIVE followed by NEGATIVE',
    )
  }

  assert.equal(
    mpNegativeResult[0].sourceCondition,
    positive,
  )
  assert.equal(
    mpNegativeResult[0].workingMemoryElement,
    positiveWme,
  )
  assert.equal(
    mpNegativeResult[1].sourceCondition,
    negative,
  )
}

{
  const factory = new AZDefaultReteNodeFactory()
  const pathBuilder =
    new AZDefaultInstantiatedConditionBuilder(
      new AZDefaultReteParentResolver(),
    )

  const root = factory.createDummyTopNode()
  const location = {
    levelsUp: 0,
    fieldNumber: 0 as const,
  }

  const condition1 = positiveCondition('split-1')
  const condition2 = positiveCondition('split-2')

  const splitProduction: AZProduction = {
    name: 'split-mp-reconstruction',
    declaredSupport: 'O_SUPPORT',
    conditions: [condition1, condition2],
    actions: [],
    instantiations: [],
  }

  const alpha1 =
    new AZAlphaMemory(
      201,
      null,
      null,
      null,
      false,
    )

  const alpha2 =
    new AZAlphaMemory(
      202,
      null,
      null,
      null,
      false,
    )

  const wme1: AZWorkingMemoryElement = {
    timetag: 201,
    identifier: symbol('S-split-1'),
    attribute: symbol('A-split-1'),
    value: symbol('V-split-1'),
    acceptable: false,
  }

  const wme2: AZWorkingMemoryElement = {
    timetag: 202,
    identifier: symbol('S-split-2'),
    attribute: symbol('A-split-2'),
    value: symbol('V-split-2'),
    acceptable: false,
  }

  const mp1 =
    factory.createMpNode(
      root,
      false,
      location,
      alpha1,
      [],
    )

  const memory2 =
    factory.createMemoryNode(
      mp1,
      false,
      location,
    )

  const positive2 =
    factory.createPositiveNode(
      memory2,
      false,
      alpha2,
      [],
    )

  const splitProductionNode =
    factory.createProductionNode(
      positive2,
      splitProduction,
    )

  const mpToken: AZToken = {
    parent: null,
    workingMemoryElement: null,
    node: mp1,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  const memoryToken: AZToken = {
    parent: mpToken,
    workingMemoryElement: wme1,
    node: memory2,
    hashReferent: null,
    negativeMatches: [],
    children: [],
  }

  mpToken.children.push(memoryToken)

  const splitResult =
    pathBuilder.build(
      splitProduction,
      splitProductionNode,
      memoryToken,
      wme2,
    )

  assert.equal(splitResult.length, 2)
  assert.equal(splitResult[0]?.type, 'POSITIVE')
  assert.equal(splitResult[1]?.type, 'POSITIVE')

  if (
    splitResult[0]?.type !== 'POSITIVE' ||
    splitResult[1]?.type !== 'POSITIVE'
  ) {
    throw new Error(
      'Expected two POSITIVE conditions for split MP path',
    )
  }

  assert.equal(
    splitResult[0].sourceCondition,
    condition1,
  )
  assert.equal(
    splitResult[0].workingMemoryElement,
    wme1,
  )
  assert.equal(
    splitResult[1].sourceCondition,
    condition2,
  )
  assert.equal(
    splitResult[1].workingMemoryElement,
    wme2,
  )
}

console.log(
  'AZ historical MP reconstruction paths: OK',
)
