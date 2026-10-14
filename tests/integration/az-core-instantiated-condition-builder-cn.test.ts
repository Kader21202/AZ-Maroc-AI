import assert from 'node:assert/strict'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import type { AZCnNode } from '../../src/engines/cognitive/az/core/production/AZCnNode'
import { AZDefaultInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiatedConditionBuilder'
import { AZDefaultReteParentResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultReteParentResolver'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZReteNodeBase } from '../../src/engines/cognitive/az/core/production/AZReteNodeBase'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type: 'IDENTIFIER',
  value: id,
})

const subcondition = {
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

const condition = {
  type: 'CONJUNCTIVE_NEGATION' as const,
  conditions: [subcondition],
}

const production: AZProduction = {
  name: 'cn-test-production',
  declaredSupport: 'UNDECLARED',
  conditions: [condition],
  actions: [],
  instantiations: [],
}

const root: AZReteNodeBase = {
  type: 'DUMMY_TOP',
  nodeId: 1,
  parent: null,
  children: [],
}

const subconditionNode: AZPositiveNode = {
  type: 'POSITIVE',
  nodeId: 2,
  parent: root,
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

const cnNode: AZCnNode = {
  type: 'CN',
  nodeId: 3,
  parent: root,
  children: [],
  partner: null,
  tokens: [],
}

const partner: AZCnNode = {
  type: 'CN_PARTNER',
  nodeId: 4,
  parent: subconditionNode,
  children: [],
  partner: cnNode,
  tokens: [],
}

cnNode.partner = partner

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 5,
  parent: cnNode,
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
assert.equal(
  result[0]?.type,
  'CONJUNCTIVE_NEGATION',
)

if (
  result[0]?.type !==
  'CONJUNCTIVE_NEGATION'
) {
  throw new Error(
    'Expected conjunctive negation instantiated condition',
  )
}

assert.equal(
  result[0].sourceCondition,
  condition,
)

assert.equal(
  result[0].conditions.length,
  1,
)

assert.equal(
  result[0].conditions[0]?.type,
  'POSITIVE',
)

if (
  result[0].conditions[0]?.type !==
  'POSITIVE'
) {
  throw new Error(
    'Expected positive CN subcondition',
  )
}

assert.equal(
  result[0].conditions[0]
    .workingMemoryElement,
  null,
)

console.log(
  'AZ core conjunctive negation reconstruction: OK',
)
