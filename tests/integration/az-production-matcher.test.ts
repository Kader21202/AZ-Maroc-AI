import assert from 'node:assert/strict'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultAlphaMemoryManager } from '../../src/engines/cognitive/az/core/production/AZDefaultAlphaMemoryManager'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import { AZDefaultReteTestBuilder } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestBuilder'
import { AZDefaultReteHashExtractor } from '../../src/engines/cognitive/az/core/production/AZReteHashExtractor'
import { AZDefaultReteMpNodeManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteMpNodeManager'
import { AZDefaultPositiveConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZPositiveConditionBuilder'
import { AZDefaultNegativeConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZNegativeConditionBuilder'
import { AZDefaultConditionNetworkBuilder } from '../../src/engines/cognitive/az/core/production/AZConditionNetworkBuilder'
import { AZDefaultRhsValueCompiler } from '../../src/engines/cognitive/az/core/production/AZRhsValueCompiler'
import { AZDefaultProductionActionCompiler } from '../../src/engines/cognitive/az/core/production/AZProductionActionCompiler'
import { AZDefaultRhsValueEquality } from '../../src/engines/cognitive/az/core/production/AZRhsValueEquality'
import { AZDefaultProductionActionListEquality } from '../../src/engines/cognitive/az/core/production/AZProductionActionListEquality'
import { AZDefaultProductionDuplicateDetector } from '../../src/engines/cognitive/az/core/production/AZProductionDuplicateDetector'
import { AZDefaultProductionMatcher } from '../../src/engines/cognitive/az/core/production/AZProductionMatcher'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZReteActivationEngine } from '../../src/engines/cognitive/az/core/production/AZReteActivationEngine'
import type { AZReteTokenRemovalManager } from '../../src/engines/cognitive/az/core/production/AZReteTokenRemovalManager'
import type { AZReteNodeRemovalManager } from '../../src/engines/cognitive/az/core/production/AZReteNodeRemovalManager'

const symbols =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const matchSet =
  new AZMatchSet()

const hashIndex =
  new AZDefaultReteHashIndex()

const alphaMemoryManager =
  new AZDefaultAlphaMemoryManager(
    workingMemory,
    hashIndex,
  )

const nodeFactory =
  new AZDefaultReteNodeFactory()

const bindings =
  new AZDefaultVariableBindingManager()

const testBuilder =
  new AZDefaultReteTestBuilder(
    bindings,
  )

const hashExtractor =
  new AZDefaultReteHashExtractor()

const mpNodeManager =
  new AZDefaultReteMpNodeManager(
    nodeFactory,
  )

const activationCalls:
  unknown[] = []

const activationEngine =
  {
    updateNodeWithMatchesFromAbove(
      child: unknown,
    ): void {
      activationCalls.push(child)
    },
  } as unknown as AZReteActivationEngine

const positiveBuilder =
  new AZDefaultPositiveConditionBuilder(
    bindings,
    testBuilder,
    hashExtractor,
    alphaMemoryManager,
    nodeFactory,
    mpNodeManager,
    activationEngine,
    matchSet,
  )

const negativeBuilder =
  new AZDefaultNegativeConditionBuilder(
    bindings,
    testBuilder,
    hashExtractor,
    alphaMemoryManager,
    nodeFactory,
    activationEngine,
    matchSet,
  )

const conditionNetworkBuilder =
  new AZDefaultConditionNetworkBuilder(
    positiveBuilder,
    negativeBuilder,
    bindings,
    nodeFactory,
  )

const rhsCompiler =
  new AZDefaultRhsValueCompiler(
    bindings,
  )

const actionCompiler =
  new AZDefaultProductionActionCompiler(
    rhsCompiler,
  )

const duplicateDetector =
  new AZDefaultProductionDuplicateDetector(
    new AZDefaultProductionActionListEquality(
      new AZDefaultRhsValueEquality(),
    ),
  )

let removedTokens = 0
let removedNodes = 0

const tokenRemovalManager =
  {
    removeTokenAndSubtree(): void {
      removedTokens += 1
    },
  } as AZReteTokenRemovalManager

const nodeRemovalManager =
  {
    removeNode(): void {
      removedNodes += 1
    },
  } as AZReteNodeRemovalManager

const matcher =
  new AZDefaultProductionMatcher(
    matchSet,
    tokenRemovalManager,
    nodeRemovalManager,
    conditionNetworkBuilder,
    actionCompiler,
    duplicateDetector,
    nodeFactory,
    activationEngine,
    bindings,
  )

const s =
  symbols.makeVariable('<s>')

const x =
  symbols.makeVariable('<x>')

const name =
  symbols.makeStringConstant('name')

const result =
  symbols.makeStringConstant('result')

const production:
  AZProduction = {
    name: 'az-production',
    declaredSupport: 'O_SUPPORT',
    conditions: [
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
    ],
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
          symbol: result,
        },
        value: {
          type: 'SYMBOL',
          symbol: x,
        },
        support: 'UNKNOWN',
      },
    ],
    instantiations: [],
  }

assert.equal(
  matcher.addProduction(production),
  'NO_REFRACTED_INSTANTIATION',
)

assert.ok(
  production.productionNode,
)

assert.ok(
  activationCalls.length >= 1,
)

assert.equal(
  activationCalls[activationCalls.length - 1],
  production.productionNode,
)

assert.equal(
  matcher.getMatchSet(),
  matchSet,
)

const compiledAction =
  production.actions[0]

assert.ok(compiledAction)
assert.equal(
  compiledAction.type,
  'MAKE',
)

if (compiledAction.type !== 'MAKE') {
  throw new Error(
    'Expected MAKE action',
  )
}

assert.equal(
  compiledAction.identifier.type,
  'RETE_LOCATION',
)

assert.equal(
  compiledAction.value.type,
  'RETE_LOCATION',
)

const duplicate:
  AZProduction = {
    name: 'az-production-copy',
    declaredSupport: 'O_SUPPORT',
    conditions: production.conditions,
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
          symbol: result,
        },
        value: {
          type: 'SYMBOL',
          symbol: x,
        },
        support: 'UNKNOWN',
      },
    ],
    instantiations: [],
  }

assert.equal(
  matcher.addProduction(duplicate),
  'DUPLICATE_PRODUCTION',
)

assert.equal(
  duplicate.productionNode ??
    null,
  null,
)

const sharedResult = symbols.makeStringConstant('shared-result')

const sharedProduction: AZProduction = {
  name: 'az-production-shared-parent',
  declaredSupport: 'O_SUPPORT',
  conditions: production.conditions,
  actions: [{
    type: 'MAKE',
    preferenceType: 'ACCEPTABLE',
    identifier: { type: 'SYMBOL', symbol: s },
    attribute: { type: 'SYMBOL', symbol: sharedResult },
    value: { type: 'SYMBOL', symbol: x },
    support: 'UNKNOWN',
  }],
  instantiations: [],
}

assert.equal(matcher.addProduction(sharedProduction), 'NO_REFRACTED_INSTANTIATION')
assert.ok(production.productionNode)
assert.ok(sharedProduction.productionNode)

const sharedParent = production.productionNode.parent
assert.notEqual(sharedParent, null)
assert.equal(sharedProduction.productionNode.parent, sharedParent)

const removedNodesBeforeSharedExcision = removedNodes

matcher.exciseProduction(sharedProduction)

assert.equal(sharedProduction.productionNode, null)
assert.ok(production.productionNode)
assert.equal(production.productionNode.parent, sharedParent)
assert.equal(sharedParent?.children.includes(production.productionNode), true)
assert.equal(removedNodes, removedNodesBeforeSharedExcision)
matcher.exciseProduction(
  production,
)

assert.equal(
  production.productionNode,
  null,
)

assert.equal(
  removedTokens,
  0,
)

assert.ok(
  removedNodes >= 1,
)

assert.throws(
  () =>
    matcher.exciseProduction(
      production,
    ),
  /not installed/,
)

console.log(
  'AZ production matcher installation and excision: OK',
)




