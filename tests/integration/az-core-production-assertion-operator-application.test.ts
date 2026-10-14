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

const attribute =
  symbol('attribute', 'STRING_CONSTANT')

const value =
  symbol('value', 'STRING_CONSTANT')

const goal = symbol('S1')
const selectedOperator = symbol('O1')
const targetIdentifier = symbol('T1')

const operatorWme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: goal,
  attribute: operatorSymbol,
  value: selectedOperator,
  acceptable: false,
}

const goalStateResolver: AZGoalStateResolver = {
  isGoal: candidate => candidate === goal,
  getLevel: candidate =>
    candidate === goal ? 1 : 0,
}

const production: AZProduction = {
  name: 'apply-selected-operator',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol: targetIdentifier,
      },
      attribute: {
        type: 'SYMBOL',
        symbol: attribute,
      },
      value: {
        type: 'SYMBOL',
        symbol: value,
      },
      support: 'UNKNOWN',
    },
  ],
  instantiations: [],
  productionNode: null,
}

const token: AZToken = {
  parent: null,
  workingMemoryElement: operatorWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const productionNode: AZProductionNode = {
  type: 'PRODUCTION',
  nodeId: 1,
  parent: null,
  children: [],
  production,
  tokens: [token],
}

const instantiatedConditionBuilder:
  AZInstantiatedConditionBuilder = {
    build: () => [
      {
        type: 'POSITIVE',
        sourceCondition: {
          type: 'POSITIVE',
          identifierTest: {
            type: 'EQUALITY',
            referent: goal,
          },
          attributeTest: {
            type: 'EQUALITY',
            referent: operatorSymbol,
          },
          valueTest: {
            type: 'EQUALITY',
            referent: selectedOperator,
          },
          acceptable: false,
        },
        workingMemoryElement: operatorWme,
      },
    ],
  }

const rhsIdentifierResolver:
  AZProductionRhsIdentifierResolver = {
    resolve: rhs =>
      rhs.type === 'SYMBOL'
        ? rhs.symbol
        : null,
  }

const resolver =
  new AZDefaultProductionAssertionTypeResolver(
    operatorSymbol,
    goalStateResolver,
    instantiatedConditionBuilder,
    rhsIdentifierResolver,
  )

assert.equal(
  resolver.resolve(
    productionNode,
    token,
    operatorWme,
  ),
  'O_ASSERTION',
)

console.log(
  'AZ core operator application support resolution: OK',
)
