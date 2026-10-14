import assert from 'node:assert/strict'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultAlphaMemoryManager } from '../../src/engines/cognitive/az/core/production/AZDefaultAlphaMemoryManager'
import { AZDefaultPositiveConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZPositiveConditionBuilder'
import { AZDefaultReteHashExtractor } from '../../src/engines/cognitive/az/core/production/AZReteHashExtractor'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteMpNodeManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteMpNodeManager'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import { AZDefaultReteTestBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestBuilder'
import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'

const symbolManager = new AZSymbolManager()
const workingMemory = new AZWorkingMemory()
const reteHashIndex = new AZDefaultReteHashIndex()

const alphaMemoryManager =
  new AZDefaultAlphaMemoryManager(
    workingMemory,
    reteHashIndex,
  )

const nodeFactory =
  new AZDefaultReteNodeFactory()

const variableBindingManager =
  new AZDefaultVariableBindingManager()

const reteTestBuilder =
  new AZDefaultReteTestBuilder(
    variableBindingManager,
  )

const reteHashExtractor =
  new AZDefaultReteHashExtractor()

const mpNodeManager =
  new AZDefaultReteMpNodeManager(
    nodeFactory,
  )

const builder =
  new AZDefaultPositiveConditionBuilder(
    variableBindingManager,
    reteTestBuilder,
    reteHashExtractor,
    alphaMemoryManager,
    nodeFactory,
    mpNodeManager,
  )

const identifierVariable =
  symbolManager.makeVariable('<s>')

const attribute =
  symbolManager.makeStringConstant('name')

const value =
  symbolManager.makeStringConstant('AZ')

const condition: AZProductionCondition = {
  type: 'POSITIVE',
  identifierTest: {
    type: 'EQUALITY',
    referent: identifierVariable,
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
}

const dummyTop =
  nodeFactory.createDummyTopNode()

const first =
  builder.build(
    condition,
    1,
    dummyTop,
  )

assert.equal(
  first.type,
  'UNHASHED_MP',
)

assert.equal(
  dummyTop.children.length,
  1,
)

assert.equal(
  alphaMemoryManager
    .getAlphaMemories()
    .length,
  1,
)

const alphaMemory =
  alphaMemoryManager
    .getAlphaMemories()[0]

assert.ok(alphaMemory)

assert.equal(
  alphaMemory.identifier,
  null,
)

assert.equal(
  alphaMemory.attribute,
  attribute,
)

assert.equal(
  alphaMemory.value,
  value,
)

assert.equal(
  alphaMemory.referenceCount,
  1,
)

assert.equal(
  variableBindingManager
    .isBound(identifierVariable),
  false,
)

const second =
  builder.build(
    condition,
    1,
    dummyTop,
  )

assert.equal(
  second,
  first,
)

assert.equal(
  dummyTop.children.length,
  1,
)

assert.equal(
  alphaMemoryManager
    .getAlphaMemories()
    .length,
  1,
)

assert.equal(
  alphaMemory.referenceCount,
  1,
)

assert.equal(
  variableBindingManager
    .isBound(identifierVariable),
  false,
)

//
// Regression: an existing MP must split into MEMORY + POSITIVE
// when another positive condition shares the memory side but
// requires a different join. Both resulting POSITIVE nodes
// must then be reused.
//
const splitRoot =
  nodeFactory.createDummyTopNode()

const splitIdentifier =
  symbolManager.makeStringConstant('split-state')

const splitAttribute =
  symbolManager.makeStringConstant('split-value')

const splitValue1 =
  symbolManager.makeStringConstant('one')

const splitValue2 =
  symbolManager.makeStringConstant('two')

const splitCondition1: AZProductionCondition = {
  type: 'POSITIVE',
  identifierTest: {
    type: 'EQUALITY',
    referent: splitIdentifier,
  },
  attributeTest: {
    type: 'EQUALITY',
    referent: splitAttribute,
  },
  valueTest: {
    type: 'EQUALITY',
    referent: splitValue1,
  },
  acceptable: false,
}

const splitCondition2: AZProductionCondition = {
  type: 'POSITIVE',
  identifierTest: {
    type: 'EQUALITY',
    referent: splitIdentifier,
  },
  attributeTest: {
    type: 'EQUALITY',
    referent: splitAttribute,
  },
  valueTest: {
    type: 'EQUALITY',
    referent: splitValue2,
  },
  acceptable: false,
}

const splitFirst =
  builder.build(
    splitCondition1,
    1,
    splitRoot,
  )

assert.equal(
  splitFirst.type,
  'UNHASHED_MP',
)

assert.equal(
  splitRoot.children[0],
  splitFirst,
)

const splitSecond =
  builder.build(
    splitCondition2,
    1,
    splitRoot,
  )

assert.equal(
  splitSecond.type,
  'UNHASHED_POSITIVE',
)

assert.equal(
  splitRoot.children.length,
  1,
)

const splitMemory =
  splitRoot.children[0]

assert.equal(
  splitMemory?.type,
  'UNHASHED_MEMORY',
)

if (
  splitMemory === undefined ||
  splitMemory.type !== 'UNHASHED_MEMORY'
) {
  throw new Error(
    'Expected UNHASHED_MEMORY after MP split',
  )
}

assert.equal(
  splitMemory.children.length,
  2,
)

assert.equal(
  splitMemory.children.includes(splitSecond),
  true,
)

const splitOldJoin =
  splitMemory.children.find(
    (child) =>
      child !== splitSecond,
  )

assert.ok(splitOldJoin)

assert.equal(
  splitOldJoin.type,
  'UNHASHED_POSITIVE',
)

const sharedSplitFirst =
  builder.build(
    splitCondition1,
    1,
    splitRoot,
  )

assert.equal(
  sharedSplitFirst,
  splitOldJoin,
)

assert.equal(
  splitMemory.children.length,
  2,
)

const sharedSplitSecond =
  builder.build(
    splitCondition2,
    1,
    splitRoot,
  )

assert.equal(
  sharedSplitSecond,
  splitSecond,
)

assert.equal(
  splitMemory.children.length,
  2,
)
console.log(
  'AZ positive condition builder: OK',
)

