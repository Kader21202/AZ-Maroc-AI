import assert from 'node:assert/strict'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultAlphaMemoryManager } from '../../src/engines/cognitive/az/core/production/AZDefaultAlphaMemoryManager'
import { AZDefaultConditionNetworkBuilder } from '../../src/engines/cognitive/az/core/production/AZConditionNetworkBuilder'
import { AZDefaultNegativeConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZNegativeConditionBuilder'
import { AZDefaultPositiveConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZPositiveConditionBuilder'
import { AZDefaultReteHashExtractor } from '../../src/engines/cognitive/az/core/production/AZReteHashExtractor'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteMpNodeManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteMpNodeManager'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import { AZDefaultReteTestBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestBuilder'
import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'

const symbolManager =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const nodeFactory =
  new AZDefaultReteNodeFactory()

const variableBindingManager =
  new AZDefaultVariableBindingManager()

const reteTestBuilder =
  new AZDefaultReteTestBuilder(
    variableBindingManager,
  )

const alphaMemoryManager =
  new AZDefaultAlphaMemoryManager(
    workingMemory,
    new AZDefaultReteHashIndex(),
  )

const reteHashExtractor =
  new AZDefaultReteHashExtractor()

const positiveBuilder =
  new AZDefaultPositiveConditionBuilder(
    variableBindingManager,
    reteTestBuilder,
    reteHashExtractor,
    alphaMemoryManager,
    nodeFactory,
    new AZDefaultReteMpNodeManager(
      nodeFactory,
    ),
  )

const negativeBuilder =
  new AZDefaultNegativeConditionBuilder(
    variableBindingManager,
    reteTestBuilder,
    reteHashExtractor,
    alphaMemoryManager,
    nodeFactory,
  )

const builder =
  new AZDefaultConditionNetworkBuilder(
    positiveBuilder,
    negativeBuilder,
    variableBindingManager,
    nodeFactory,
  )

const s =
  symbolManager.makeVariable('<s>')

const x =
  symbolManager.makeVariable('<x>')

const name =
  symbolManager.makeStringConstant('name')

const blocked =
  symbolManager.makeStringConstant('blocked')

const az =
  symbolManager.makeStringConstant('AZ')

const yes =
  symbolManager.makeStringConstant('yes')

const conditions:
  readonly AZProductionCondition[] = [
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: s,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: name,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: x,
      },
      acceptable: false,
    },
    {
      type: 'CONJUNCTIVE_NEGATION',
      conditions: [
        {
          type: 'POSITIVE',
          identifierTest: {
            type: 'EQUALITY',
            referent: s,
          },
          attributeTest: {
            type: 'EQUALITY',
            referent: blocked,
          },
          valueTest: {
            type: 'EQUALITY',
            referent: yes,
          },
          acceptable: false,
        },
      ],
    },
  ]

const dummyTop =
  nodeFactory.createDummyTopNode()

const result =
  builder.build(
    conditions,
    1,
    dummyTop,
    true,
  )

assert.equal(
  result.bottomDepth,
  2,
)

assert.equal(
  result.bottomNode.type,
  'CN',
)

assert.equal(
  result.boundVariables.includes(s),
  true,
)

assert.equal(
  result.boundVariables.includes(x),
  true,
)

assert.equal(
  variableBindingManager.isBound(s),
  true,
)

assert.equal(
  variableBindingManager.isBound(x),
  true,
)

const cn =
  result.bottomNode

if (cn.type !== 'CN') {
  throw new Error(
    'Expected CN bottom node',
  )
}

assert.ok(cn.partner)

assert.equal(
  cn.partner?.type,
  'CN_PARTNER',
)

assert.ok(
  cn.partner?.parent,
)

variableBindingManager.popBindings(
  result.boundVariables,
)

assert.equal(
  variableBindingManager.isBound(s),
  false,
)

assert.equal(
  variableBindingManager.isBound(x),
  false,
)

const second =
  builder.build(
    conditions,
    1,
    dummyTop,
    false,
  )

assert.equal(
  second.bottomNode,
  result.bottomNode,
)

assert.equal(
  second.boundVariables.length,
  0,
)

assert.equal(
  variableBindingManager.isBound(s),
  false,
)

assert.equal(
  variableBindingManager.isBound(x),
  false,
)
/*
 * A variable introduced only inside a conjunctive
 * negation must not escape the CN construction.
 */
const cnLocalVariable =
  symbolManager.makeVariable('<cn-local>')

const cnLocalRoot =
  nodeFactory.createDummyTopNode()

const cnLocalCondition:
  AZProductionCondition = {
    type: 'CONJUNCTIVE_NEGATION',
    conditions: [
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: cnLocalVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent: blocked,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: yes,
        },
        acceptable: false,
      },
    ],
  }

const cnLocalResult =
  builder.build(
    [cnLocalCondition],
    1,
    cnLocalRoot,
    false,
  )

assert.equal(
  cnLocalResult.bottomNode.type,
  'CN',
)

assert.equal(
  variableBindingManager.isBound(
    cnLocalVariable,
  ),
  false,
)
/*
 * Empty condition list keeps the supplied parent and
 * preserves the historical depth convention.
 */
const emptyRoot =
  nodeFactory.createDummyTopNode()

const empty =
  builder.build(
    [],
    5,
    emptyRoot,
    false,
  )

assert.equal(empty.bottomNode, emptyRoot)
assert.equal(empty.bottomDepth, 4)
assert.equal(empty.boundVariables.length, 0)

/*
 * A failure after a positive condition has introduced
 * dense bindings must roll those bindings back even
 * when retainBindings is true.
 */
const retainedBeforeFailure =
  symbolManager.makeVariable(
    '<retained-before-failure>',
  )

const unboundFailureVariable =
  symbolManager.makeVariable(
    '<unbound-failure>',
  )

const failureAttributeOne =
  symbolManager.makeStringConstant(
    'first-failure',
  )

const failureAttributeTwo =
  symbolManager.makeStringConstant(
    'second-failure',
  )

const failureValue =
  symbolManager.makeStringConstant(
    'value-failure',
  )

const failingConditions:
  readonly AZProductionCondition[] = [
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: retainedBeforeFailure,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: failureAttributeOne,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: failureValue,
      },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'LESS',
        referent: unboundFailureVariable,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: failureAttributeTwo,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: failureValue,
      },
      acceptable: false,
    },
  ]

const failureRoot =
  nodeFactory.createDummyTopNode()

assert.throws(
  () =>
    builder.build(
      failingConditions,
      1,
      failureRoot,
      true,
    ),
  /Rete build found test of unbound variable/,
)

assert.equal(
  variableBindingManager.isBound(
    retainedBeforeFailure,
  ),
  false,
)

assert.equal(
  variableBindingManager.isBound(
    unboundFailureVariable,
  ),
  false,
)
console.log(
  'AZ condition network builder: OK',
)
