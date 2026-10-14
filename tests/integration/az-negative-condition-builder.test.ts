import assert from 'node:assert/strict'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultAlphaMemoryManager } from '../../src/engines/cognitive/az/core/production/AZDefaultAlphaMemoryManager'
import { AZDefaultNegativeConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZNegativeConditionBuilder'
import { AZDefaultReteHashExtractor } from '../../src/engines/cognitive/az/core/production/AZReteHashExtractor'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import { AZDefaultReteTestBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestBuilder'
import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'

const symbolManager = new AZSymbolManager()
const workingMemory = new AZWorkingMemory()
const reteHashIndex =
  new AZDefaultReteHashIndex()

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

const builder =
  new AZDefaultNegativeConditionBuilder(
    variableBindingManager,
    reteTestBuilder,
    new AZDefaultReteHashExtractor(),
    alphaMemoryManager,
    nodeFactory,
  )

const identifierVariable =
  symbolManager.makeVariable('<s>')

const attribute =
  symbolManager.makeStringConstant('name')

const value =
  symbolManager.makeStringConstant('AZ')

const condition: AZProductionCondition = {
  type: 'NEGATIVE',
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
  'UNHASHED_NEGATIVE',
)

assert.equal(
  dummyTop.children.length,
  1,
)

assert.equal(
  dummyTop.children[0],
  first,
)

assert.equal(
  alphaMemoryManager
    .getAlphaMemories().length,
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
  dummyTop.children[0],
  first,
)

assert.equal(
  alphaMemoryManager
    .getAlphaMemories().length,
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

console.log(
  'AZ negative condition builder: OK',
)

