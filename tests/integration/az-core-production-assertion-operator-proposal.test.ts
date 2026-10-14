import assert from 'node:assert/strict'

import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZDefaultProductionAssertionTypeResolver } from '../../src/engines/cognitive/az/core/production/AZDefaultProductionAssertionTypeResolver'
import type { AZGoalStateResolver } from '../../src/engines/cognitive/az/core/production/AZGoalStateResolver'
import type { AZInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZInstantiatedConditionBuilder'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZProductionRhsIdentifierResolver } from '../../src/engines/cognitive/az/core/production/AZProductionRhsIdentifierResolver'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbol = (
  id: string,
  type: AZSymbol['type'] = 'IDENTIFIER',
): AZSymbol => ({
  id,
  hashId: 1,
  type,
  value: id,
})

const operatorSymbol =
  symbol('operator', 'STRING_CONSTANT')

const goal = symbol('S1')

const goalStateResolver: AZGoalStateResolver = {
  isGoal: candidate => candidate === goal,
  getLevel: candidate =>
    candidate === goal ? 1 : 0,
}

const instantiatedConditionBuilder:
  AZInstantiatedConditionBuilder = {
    build: () => {
      throw new Error(
        'Operator proposal must resolve before condition inspection',
      )
    },
  }

const rhsIdentifierResolver:
  AZProductionRhsIdentifierResolver = {
    resolve: value =>
      value.type === 'SYMBOL'
        ? value.symbol
        : null,
  }

const resolver =
  new AZDefaultProductionAssertionTypeResolver(
    operatorSymbol,
    goalStateResolver,
    instantiatedConditionBuilder,
    rhsIdentifierResolver,
  )

const production: AZProduction = {
  name: 'propose-operator',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol: goal,
      },
      attribute: {
        type: 'SYMBOL',
        symbol: operatorSymbol,
      },
      value: {
        type: 'SYMBOL',
        symbol: symbol('O1'),
      },
      support: 'UNKNOWN',
    },
  ],
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
  'AZ core operator proposal support resolution: OK',
)
