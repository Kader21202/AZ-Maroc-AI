import assert from 'node:assert/strict'

import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
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
    build: () => {
      throw new Error(
        'Declared support must not inspect instantiated conditions',
      )
    },
  }

const rhsIdentifierResolver:
  AZProductionRhsIdentifierResolver = {
    resolve: () => {
      throw new Error(
        'Declared support must not resolve RHS identifiers',
      )
    },
  }

const resolver =
  new AZDefaultProductionAssertionTypeResolver(
    operatorSymbol,
    goalStateResolver,
    instantiatedConditionBuilder,
    rhsIdentifierResolver,
  )

const parentToken: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const production = (
  declaredSupport: 'O_SUPPORT' | 'I_SUPPORT',
): AZProduction => ({
  name: `production-${declaredSupport}`,
  declaredSupport,
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
})

const productionNode = (
  value: AZProduction,
): AZProductionNode => ({
  type: 'PRODUCTION',
  nodeId: 1,
  parent: null,
  children: [],
  production: value,
  tokens: [],
})

assert.equal(
  resolver.resolve(
    productionNode(
      production('O_SUPPORT'),
    ),
    parentToken,
    null,
  ),
  'O_ASSERTION',
)

assert.equal(
  resolver.resolve(
    productionNode(
      production('I_SUPPORT'),
    ),
    parentToken,
    null,
  ),
  'I_ASSERTION',
)

console.log(
  'AZ core explicit production support resolution: OK',
)
