import assert from 'node:assert/strict'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiatedConditionBuilder'
import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
import type { AZNegativeNode } from '../../src/engines/cognitive/az/core/production/AZNegativeNode'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const condition = {
  type: 'NEGATIVE' as const,
  identifierTest: {
    type: 'EQUALITY' as const,
    referent: symbol('I'),
  },
  attributeTest: {
    type: 'EQUALITY' as const,
    referent: symbol('A'),
  },
  valueTest: {
    type: 'EQUALITY' as const,
    referent: symbol('V'),
  },
  acceptable: false,
}

const production: AZProduction = {
  name: 'negative-test-production',
  declaredSupport: 'UNDECLARED',
  conditions: [condition],
  actions: [],
  instantiations: [],
}

const negativeNode: AZNegativeNode = {
  type: 'NEGATIVE',
  nodeId: 1,
  parent: null,
  children: [],
  leftHashFieldNumber: null,
  leftHashLevelsUp: null,
  alphaMemory: new AZAlphaMemory(
    1,
    null,
    null,
    null,
    false,
  ),
  tests: [],
  tokens: [],
  rightUnlinked: false,
}

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 2,
  parent: negativeNode,
  children: [],
  production,
  tokens: [],
}

const builder =
  new AZDefaultInstantiatedConditionBuilder(
    new AZDefaultReteParentResolver(),
  )

const result =
  builder.build(
    production,
    productionNode,
    null,
    null,
  )

assert.equal(result.length, 1)
assert.equal(result[0]?.type, 'NEGATIVE')

if (result[0]?.type !== 'NEGATIVE') {
  throw new Error('Expected negative instantiated condition')
}

assert.equal(
  result[0].sourceCondition,
  condition,
)

console.log(
  'AZ core instantiated negative condition reconstruction: OK',
)
