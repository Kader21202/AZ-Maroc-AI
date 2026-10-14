import assert from 'node:assert/strict'

import { AZDefaultInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiatedConditionBuilder'
import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const condition = {
  type: 'POSITIVE' as const,
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
  name: 'test-production',
  declaredSupport: 'UNDECLARED',
  conditions: [condition],
  actions: [],
  instantiations: [],
}

const positiveNode: AZPositiveNode = {
  type: 'POSITIVE',
  nodeId: 1,
  parent: null,
  children: [],
  alphaMemory: new AZAlphaMemory(
    1,
    null,
    null,
    null,
    false,
  ),
  tests: [],
  leftUnlinked: false,
  rightUnlinked: false,
}

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 2,
  parent: positiveNode,
  children: [],
  production,
  tokens: [],
}

const wme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: symbol('S'),
  attribute: symbol('A'),
  value: symbol('V'),
  acceptable: false,
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
    wme,
  )

assert.equal(result.length, 1)
assert.equal(result[0]?.type, 'POSITIVE')

if (result[0]?.type !== 'POSITIVE') {
  throw new Error('Expected positive instantiated condition')
}

assert.equal(
  result[0].sourceCondition,
  condition,
)

assert.equal(
  result[0].workingMemoryElement,
  wme,
)

console.log(
  'AZ core instantiated positive condition reconstruction: OK',
)

