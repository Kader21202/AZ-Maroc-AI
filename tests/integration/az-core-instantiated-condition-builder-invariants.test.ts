import assert from 'node:assert/strict'

import { AZDefaultInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiatedConditionBuilder'
import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
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
  name: 'production-a',
  declaredSupport: 'UNDECLARED',
  conditions: [condition],
  actions: [],
  instantiations: [],
}

const otherProduction: AZProduction = {
  name: 'production-b',
  declaredSupport: 'UNDECLARED',
  conditions: [condition],
  actions: [],
  instantiations: [],
}

const mismatchedNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 1,
  parent: null,
  children: [],
  production: otherProduction,
  tokens: [],
}

const parentlessNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 2,
  parent: null,
  children: [],
  production,
  tokens: [],
}

const builder =
  new AZDefaultInstantiatedConditionBuilder(
    new AZDefaultReteParentResolver(),
  )

assert.throws(
  () =>
    builder.build(
      production,
      mismatchedNode,
      null,
      null,
    ),
  /Production node does not belong to the supplied production/,
)

assert.throws(
  () =>
    builder.build(
      production,
      parentlessNode,
      null,
      null,
    ),
  /Production with conditions requires a RETE parent/,
)

console.log(
  'AZ core instantiated condition builder invariants: OK',
)
