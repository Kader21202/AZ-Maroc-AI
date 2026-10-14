import assert from 'node:assert/strict'

import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZInstantiationFiringEngine } from '../../src/engines/cognitive/az/core/production/AZInstantiationFiringEngine'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZRhsFunctionRegistry } from '../../src/engines/cognitive/az/core/production/AZRhsFunctionRegistry'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbols =
  new AZSymbolManager()

const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()

const goal =
  symbols.makeIdentifier('S')

identifierStates.register(
  goal,
  {
    level: 3,
    promotionLevel: 3,
  },
)

const attribute =
  symbols.makeStringConstant('answer')

const value =
  symbols.makeStringConstant('Rabat')

const production: AZProduction = {
  name: 'az-native-firing',
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

const productionNode = {
  type: 'PRODUCTION',
  production,
  parent: null,
  children: [],
  tokens: [],
} as unknown as AZProductionNode

production.productionNode =
  productionNode

const reteToken: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const assertionToken: AZToken = {
  parent: reteToken,
  workingMemoryElement: null,
  node: productionNode,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const matchSet =
  new AZMatchSet()

matchSet.addAssertion({
  type: 'O_ASSERTION',
  production,
  token: assertionToken,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 3,
})

const firingEngine =
  new AZInstantiationFiringEngine(
    symbols,
    identifierStates,
  )

const result =
  firingEngine.fire(
    matchSet,
    'O_ASSERTION',
    goal,
    {
      activeLevel: 3,
      highestActiveLevel: 3,
      changeLevel: 0,
      nextChangeLevel: 0,
    },
  )

assert.equal(
  result.assertionsExisted,
  true,
)

assert.equal(
  result.createdInstantiations.length,
  1,
)

assert.equal(
  result.nextChangeLevel,
  3,
)

const instantiation =
  result.createdInstantiations[0]

assert.ok(instantiation)

assert.equal(
  instantiation.reteToken,
  reteToken,
)

assert.equal(
  instantiation.matchGoal,
  goal,
)

assert.equal(
  instantiation.generatedPreferences.length,
  1,
)

const preference =
  instantiation.generatedPreferences[0]

assert.ok(preference)

assert.equal(
  preference.identifier,
  goal,
)

assert.equal(
  preference.attribute,
  attribute,
)

assert.equal(
  preference.value,
  value,
)

assert.equal(
  preference.oSupported,
  true,
)

assert.deepEqual(
  firingEngine
    .goalPreferenceRegistry
    .get(goal),
  [preference],
)

assert.equal(
  matchSet.hasAssertion(
    'O_ASSERTION',
    goal,
  ),
  false,
)

//
// Lower-level waterfall policy:
// an RHS identifier at or below
// changeLevel must postpone the firing.
//
const blockedMatchSet =
  new AZMatchSet()

blockedMatchSet.addAssertion({
  type: 'O_ASSERTION',
  production,
  token: assertionToken,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 3,
})

const blocked =
  firingEngine.fire(
    blockedMatchSet,
    'O_ASSERTION',
    goal,
    {
      activeLevel: 3,
      highestActiveLevel: 1,
      changeLevel: 3,
      nextChangeLevel: 0,
    },
  )

assert.equal(
  blocked.createdInstantiations.length,
  0,
)

assert.equal(
  blocked.assertionsExisted,
  true,
)

assert.equal(
  blocked.nextChangeLevel,
  3,
)

assert.equal(
  blockedMatchSet.hasAssertion(
    'O_ASSERTION',
    goal,
  ),
  true,
)

console.log(
  'AZ autonomous RETE-to-RHS firing: OK',
)

//
// Standalone RHS FUNCALL firing:
// firing must execute the function without generating a preference
// while preserving the RETE provenance of the instantiation.
//
const standaloneFunctionRegistry =
  new AZRhsFunctionRegistry()

const standaloneFunctionName =
  symbols.makeStringConstant(
    'record-fire',
  )

const standaloneArgument =
  symbols.makeIntegerConstant(42)

let standaloneExecutionCount = 0
let standaloneReceivedArgument = null

standaloneFunctionRegistry.register(
  standaloneFunctionName,
  {
    numArgsExpected: 1,
    canBeRhsValue: false,
    canBeStandaloneAction: true,

    execute(arguments_) {
      standaloneExecutionCount += 1
      standaloneReceivedArgument =
        arguments_[0] ?? null

      return null
    },
  },
)

const standaloneProduction: AZProduction = {
  name: 'az-rhs-funcall-firing',
  declaredSupport: 'I_SUPPORT',
  conditions: [],
  actions: [
    {
      type: 'FUNCALL',
      functionCall: {
        type: 'FUNCALL',
        functionName:
          standaloneFunctionName,
        arguments: [
          {
            type: 'SYMBOL',
            symbol: standaloneArgument,
          },
        ],
      },
    },
  ],
  instantiations: [],
  productionNode: null,
}

const standaloneProductionNode = {
  type: 'PRODUCTION',
  production: standaloneProduction,
  parent: null,
  children: [],
  tokens: [],
} as unknown as AZProductionNode

standaloneProduction.productionNode =
  standaloneProductionNode

const standaloneWme = {
  timetag: 1,
  identifier: goal,
  attribute:
    symbols.makeStringConstant('status'),
  value:
    symbols.makeStringConstant('ready'),
  acceptable: false,
}

const standaloneParentToken: AZToken = {
  parent: null,
  workingMemoryElement: standaloneWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const standaloneAssertionToken: AZToken = {
  parent: standaloneParentToken,
  workingMemoryElement: standaloneWme,
  node: standaloneProductionNode,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const standaloneMatchSet =
  new AZMatchSet()

standaloneMatchSet.addAssertion({
  type: 'I_ASSERTION',
  production: standaloneProduction,
  token: standaloneAssertionToken,
  wme: standaloneWme,
  matchGoal: goal,
  matchGoalLevel: 3,
})

const standaloneFiringEngine =
  new AZInstantiationFiringEngine(
    symbols,
    identifierStates,
    standaloneFunctionRegistry,
  )

const standaloneResult =
  standaloneFiringEngine.fire(
    standaloneMatchSet,
    'I_ASSERTION',
    goal,
    {
      activeLevel: 3,
      highestActiveLevel: 3,
      changeLevel: 3,
      nextChangeLevel: 3,
    },
  )

assert.equal(
  standaloneExecutionCount,
  1,
)

assert.equal(
  standaloneReceivedArgument,
  standaloneArgument,
)

assert.equal(
  standaloneResult.createdInstantiations.length,
  1,
)

const standaloneInstantiation =
  standaloneResult.createdInstantiations[0]

assert.ok(standaloneInstantiation)

assert.equal(
  standaloneInstantiation
    .generatedPreferences.length,
  0,
)

assert.equal(
  standaloneInstantiation.reteToken,
  standaloneParentToken,
)

assert.equal(
  standaloneInstantiation.reteWme,
  standaloneWme,
)

console.log(
  'AZ RHS standalone FUNCALL firing: OK',
)
//
// Match-set assertion ordering:
// AZ inserts new assertions at the head of the active-goal
// assertion list, so two eligible assertions created first/second
// must fire second/first.
//
const orderFirstProduction: AZProduction = {
  name: 'az-order-first',
  declaredSupport: 'O_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const orderSecondProduction: AZProduction = {
  name: 'az-order-second',
  declaredSupport: 'O_SUPPORT',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const orderFirstNode = {
  type: 'PRODUCTION',
  production: orderFirstProduction,
  parent: null,
  children: [],
  tokens: [],
} as unknown as AZProductionNode

const orderSecondNode = {
  type: 'PRODUCTION',
  production: orderSecondProduction,
  parent: null,
  children: [],
  tokens: [],
} as unknown as AZProductionNode

orderFirstProduction.productionNode = orderFirstNode
orderSecondProduction.productionNode = orderSecondNode

const orderParentToken: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const orderFirstToken: AZToken = {
  parent: orderParentToken,
  workingMemoryElement: null,
  node: orderFirstNode,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const orderSecondToken: AZToken = {
  parent: orderParentToken,
  workingMemoryElement: null,
  node: orderSecondNode,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const orderMatchSet = new AZMatchSet()

orderMatchSet.addAssertion({
  type: 'O_ASSERTION',
  production: orderFirstProduction,
  token: orderFirstToken,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 3,
})

orderMatchSet.addAssertion({
  type: 'O_ASSERTION',
  production: orderSecondProduction,
  token: orderSecondToken,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 3,
})

const orderResult = firingEngine.fire(
  orderMatchSet,
  'O_ASSERTION',
  goal,
  {
    activeLevel: 3,
    highestActiveLevel: 3,
    changeLevel: 0,
    nextChangeLevel: 0,
  },
)

for (const candidate of orderResult.createdInstantiations) {
  assert.ok(candidate.production)
}

assert.deepEqual(
  orderResult.createdInstantiations.map(
    candidate => candidate.production?.name,
  ),
  [
    'az-order-second',
    'az-order-first',
  ],
  'AZ invariant: assertions for the same goal and firing type must fire newest-first',
)

//
// Completed-instantiation integration boundary:
// the handler must observe an instantiation only after
// all RHS actions have generated their preferences.
//
const completedMatchSet =
  new AZMatchSet()

completedMatchSet.addAssertion({
  type: 'O_ASSERTION',
  production,
  token: assertionToken,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 3,
})

const completedObservations:
  AZInstantiation[] = []

const completedHandler = {
  handle(
    completedInstantiation: AZInstantiation,
  ): readonly AZInstantiation[] {
    assert.equal(
      completedInstantiation
        .generatedPreferences.length,
      1,
      'Completed-instantiation handler must run after all RHS preferences are generated',
    )

    completedObservations.push(
      completedInstantiation,
    )

    return []
  },
}

const completedFiringEngine =
  new AZInstantiationFiringEngine(
    symbols,
    identifierStates,
    null,
    undefined,
    completedHandler,
  )

const completedResult =
  completedFiringEngine.fire(
    completedMatchSet,
    'O_ASSERTION',
    goal,
    {
      activeLevel: 3,
      highestActiveLevel: 3,
      changeLevel: 0,
      nextChangeLevel: 0,
    },
  )

assert.equal(
  completedObservations.length,
  1,
  'Exactly one completed instantiation must be reported',
)

assert.equal(
  completedObservations[0],
  completedResult.createdInstantiations[0],
  'Handler must receive the same instantiation returned by the firing engine',
)

console.log(
  'AZ completed-instantiation integration boundary: OK',
)


//
// Completed-instantiation expansion:
// a completed instantiation may generate an additional
// instantiation (for example an EBC justification), and that
// generated instantiation must join the same newly-created flow.
//
const expandedMatchSet =
  new AZMatchSet()

expandedMatchSet.addAssertion({
  type: 'O_ASSERTION',
  production,
  token: assertionToken,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 3,
})

const learnedInstantiation: AZInstantiation = {
  id: 999999,
  production: null,
  instantiatedConditions: [],
  matchGoal: goal,
  matchGoalLevel: 3,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const expandingHandler = {
  handle(
    completedInstantiation: AZInstantiation,
  ): readonly AZInstantiation[] {
    assert.equal(
      completedInstantiation.generatedPreferences.length,
      1,
    )

    return [learnedInstantiation]
  },
}

const expandedFiringEngine =
  new AZInstantiationFiringEngine(
    symbols,
    identifierStates,
    null,
    undefined,
    expandingHandler,
  )

const expandedResult =
  expandedFiringEngine.fire(
    expandedMatchSet,
    'O_ASSERTION',
    goal,
    {
      activeLevel: 3,
      highestActiveLevel: 3,
      changeLevel: 0,
      nextChangeLevel: 0,
    },
  )

assert.equal(
  expandedResult.createdInstantiations.length,
  2,
  'A justification instantiation generated by the completed handler must join the newly-created instantiation flow',
)

assert.equal(
  expandedResult.createdInstantiations[1],
  learnedInstantiation,
  'Generated justification instantiation must be returned by the firing engine',
)

console.log(
  'AZ completed-instantiation expansion: OK',
)


