import assert from 'node:assert/strict'

import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZDefaultProductionAssertionTypeResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultProductionAssertionTypeResolver'
import type { AZGoalStateResolver } from '../../src/engines/cognitive/az/core/production/AZGoalStateResolver'
import type { AZInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZInstantiatedConditionBuilder'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZProductionRhsIdentifierResolver } from '../../src/engines/cognitive/az/core/production/AZProductionRhsIdentifierResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const operatorSymbol: AZSymbol = {
  id: 'operator',
  hashId: 1,
  type: 'STRING_CONSTANT',
  value: 'operator',
}

const goalStateResolver: AZGoalStateResolver = {
  isGoal: () => false,
  getLevel: () => 0,
}

const instantiatedConditionBuilder:
  AZInstantiatedConditionBuilder = {
    build: () => [],
  }

const rhsIdentifierResolver:
  AZProductionRhsIdentifierResolver = {
    resolve: () => null,
  }

const resolver =
  new AZDefaultProductionAssertionTypeResolver(
    operatorSymbol,
    goalStateResolver,
    instantiatedConditionBuilder,
    rhsIdentifierResolver,
  )

const production: AZProduction = {
  name: 'undeclared-default-i-support',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 1,
  parent: null,
  children: [],
  production,
  tokens: [],
}

const parentToken: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

assert.equal(
  resolver.resolve(
    productionNode,
    parentToken,
    null,
  ),
  'I_ASSERTION',
)

console.log(
  'AZ core undeclared default I-support resolution: OK',
)
