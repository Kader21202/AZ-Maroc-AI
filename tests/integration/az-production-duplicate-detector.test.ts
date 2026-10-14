import assert from 'node:assert/strict'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import {
  AZDefaultRhsValueEquality,
} from '../../src/engines/cognitive/az/core/production/AZRhsValueEquality'
import {
  AZDefaultProductionActionListEquality,
} from '../../src/engines/cognitive/az/core/production/AZProductionActionListEquality'
import {
  AZDefaultProductionDuplicateDetector,
} from '../../src/engines/cognitive/az/core/production/AZProductionDuplicateDetector'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZDummyTopNode } from '../../src/engines/cognitive/az/core/production/AZDummyTopNode'

const symbols =
  new AZSymbolManager()

const rhsEquality =
  new AZDefaultRhsValueEquality()

const actionEquality =
  new AZDefaultProductionActionListEquality(
    rhsEquality,
  )

const duplicateDetector =
  new AZDefaultProductionDuplicateDetector(
    actionEquality,
  )

const s =
  symbols.makeStringConstant('s')

const a =
  symbols.makeStringConstant('a')

const v =
  symbols.makeStringConstant('v')

const functionName =
  symbols.makeStringConstant('f')

assert.equal(
  rhsEquality.equals(
    {
      type: 'RETE_LOCATION',
      fieldNumber: 0,
      levelsUp: 1,
    },
    {
      type: 'RETE_LOCATION',
      fieldNumber: 0,
      levelsUp: 1,
    },
  ),
  true,
)

assert.equal(
  rhsEquality.equals(
    {
      type: 'UNBOUND_VARIABLE',
      index: 2,
    },
    {
      type: 'UNBOUND_VARIABLE',
      index: 3,
    },
  ),
  false,
)

assert.equal(
  rhsEquality.equals(
    {
      type: 'FUNCALL',
      functionName,
      arguments: [
        {
          type: 'SYMBOL',
          symbol: v,
        },
      ],
    },
    {
      type: 'FUNCALL',
      functionName,
      arguments: [
        {
          type: 'SYMBOL',
          symbol: v,
        },
        {
          type: 'SYMBOL',
          symbol: a,
        },
      ],
    },
  ),
  true,
)

const productionA:
  AZProduction = {
    name: 'p-a',
    declaredSupport: 'UNDECLARED',
    conditions: [],
    actions: [
      {
        type: 'MAKE',
        preferenceType:
          'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: s,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: a,
        },
        value: {
          type: 'SYMBOL',
          symbol: v,
        },
        support: 'UNKNOWN',
      },
    ],
    instantiations: [],
  }

const productionB:
  AZProduction = {
    name: 'p-b',
    declaredSupport: 'UNDECLARED',
    conditions: [],
    actions: [
      {
        type: 'MAKE',
        preferenceType:
          'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: s,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: a,
        },
        value: {
          type: 'SYMBOL',
          symbol: v,
        },
        support: 'O_SUPPORT',
      },
    ],
    instantiations: [],
  }

assert.equal(
  actionEquality.equals(
    productionA.actions,
    productionB.actions,
  ),
  true,
)

//
// Official same_rhs action-list semantics:
// list length, action kind and FUNCALL
// early-return behavior.
//
assert.equal(
  actionEquality.equals(
    productionA.actions,
    [
      ...productionA.actions,
      ...productionA.actions,
    ],
  ),
  false,
)

const funcallAction = {
  type: 'FUNCALL' as const,
  functionCall: {
    type: 'FUNCALL' as const,
    functionName,
    arguments: [
      {
        type: 'SYMBOL' as const,
        symbol: v,
      },
    ],
  },
}

assert.equal(
  actionEquality.equals(
    [funcallAction],
    productionA.actions,
  ),
  false,
)

assert.equal(
  actionEquality.equals(
    [
      funcallAction,
      productionA.actions[0]!,
    ],
    [
      funcallAction,
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: s,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: a,
        },
        value: {
          type: 'SYMBOL',
          symbol: a,
        },
        support: 'UNKNOWN',
      },
    ],
  ),
  true,
)
const root:
  AZDummyTopNode = {
    type: 'DUMMY_TOP',
    nodeId: 1,
    parent: null,
    children: [],
    tokens: [],
  }

const productionDifferent:
  AZProduction = {
    ...productionB,
    name: 'p-c',
    actions: [
      {
        type: 'MAKE',
        preferenceType:
          'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: s,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: a,
        },
        value: {
          type: 'SYMBOL',
          symbol: a,
        },
        support: 'UNKNOWN',
      },
    ],
    instantiations: [],
  }

const differentNode:
  AZProductionNode = {
    type: 'PRODUCTION',
    nodeId: 2,
    parent: root,
    children: [],
    production: productionDifferent,
    tokens: [],
  }

const productionNode:
  AZProductionNode = {
    type: 'PRODUCTION',
    nodeId: 3,
    parent: root,
    children: [],
    production: productionA,
    tokens: [],
  }

root.children.push(
  differentNode,
  productionNode,
)

productionDifferent.productionNode =
  differentNode

productionA.productionNode =
  productionNode

assert.equal(
  duplicateDetector.findDuplicate(
    root,
    productionB,
  ),
  productionA,
  'duplicate scan must continue past a different P-node',
)

assert.equal(
  duplicateDetector.findDuplicate(
    root,
    {
      ...productionDifferent,
      name: 'p-absent',
      actions: [
        {
          type: 'MAKE',
          preferenceType: 'ACCEPTABLE',
          identifier: {
            type: 'SYMBOL',
            symbol: s,
          },
          attribute: {
            type: 'SYMBOL',
            symbol: a,
          },
          value: {
            type: 'SYMBOL',
            symbol: symbols.makeStringConstant('absent-value'),
          },
          support: 'UNKNOWN',
        },
      ],
      instantiations: [],
      productionNode: null,
    },
  ),
  null,
)
console.log(
  'AZ production equality and duplicate detection: OK',
)





