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

const shallowGoal = symbol('S1')
const deepGoal = symbol('S2')
const selectedOperator = symbol('O1')

const wme = (
  timetag: number,
  identifier: AZSymbol,
  attributeSymbol: AZSymbol,
  valueSymbol: AZSymbol,
  acceptable = false,
): AZWorkingMemoryElement => ({
  timetag,
  identifier,
  attribute: attributeSymbol,
  value: valueSymbol,
  acceptable,
})

const shallowGoalWme = wme(
  1,
  shallowGoal,
  attribute,
  value,
)

const deepGoalWme = wme(
  2,
  deepGoal,
  attribute,
  value,
)

const operatorWme = wme(
  3,
  deepGoal,
  operatorSymbol,
  selectedOperator,
  false,
)

const goalStateResolver: AZGoalStateResolver = {
  isGoal: candidate =>
    candidate === shallowGoal ||
    candidate === deepGoal,

  getLevel: candidate => {
    if (candidate === shallowGoal) {
      return 1
    }

    if (candidate === deepGoal) {
      return 2
    }

    return 0
  },
}

const production: AZProduction = {
  name: 'elaborate-selected-operator',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol: selectedOperator,
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
            referent: shallowGoal,
          },
          attributeTest: {
            type: 'EQUALITY',
            referent: attribute,
          },
          valueTest: {
            type: 'EQUALITY',
            referent: value,
          },
          acceptable: false,
        },
        workingMemoryElement: shallowGoalWme,
      },
      {
        type: 'POSITIVE',
        sourceCondition: {
          type: 'POSITIVE',
          identifierTest: {
            type: 'EQUALITY',
            referent: deepGoal,
          },
          attributeTest: {
            type: 'EQUALITY',
            referent: attribute,
          },
          valueTest: {
            type: 'EQUALITY',
            referent: value,
          },
          acceptable: false,
        },
        workingMemoryElement: deepGoalWme,
      },
      {
        type: 'POSITIVE',
        sourceCondition: {
          type: 'POSITIVE',
          identifierTest: {
            type: 'EQUALITY',
            referent: deepGoal,
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
  'I_ASSERTION',
)

console.log(
  'AZ core operator elaboration support resolution: OK',
)
