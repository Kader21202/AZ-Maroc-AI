import assert from 'node:assert/strict'

import { AZElaborationActivityResolver } from '../../src/engines/cognitive/az/core/cycle/AZElaborationActivityResolver'
import {
  AZElaborationConvergenceRunner,
  type AZElaborationCyclePort,
} from '../../src/engines/cognitive/az/core/cycle/AZElaborationConvergenceRunner'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { DefaultActiveGoalResolver } from '../../src/engines/cognitive/az/core/state/DefaultActiveGoalResolver'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()

const stack =
  new AZStateStack()

const topGoal =
  symbols.makeIdentifier('S')

const lowerGoal =
  symbols.makeIdentifier('S')

identifierStates.register(
  topGoal,
  {
    level: 1,
    promotionLevel: 1,
  },
)

identifierStates.register(
  lowerGoal,
  {
    level: 2,
    promotionLevel: 2,
  },
)

const top =
  stack.setTop({}, topGoal)

stack.appendLower(
  top,
  {},
  lowerGoal,
)

const production: AZProduction = {
  name: 'activity-test',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const token: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

function makeMatchSet(
  type:
    'I_ASSERTION' | 'O_ASSERTION',
  goal:
    typeof topGoal,
): AZMatchSet {
  const matchSet =
    new AZMatchSet()

  matchSet.addAssertion({
    type,
    production,
    token,
    wme: null,
    matchGoal: goal,
    matchGoalLevel:
      identifierStates.get(goal).level,
  })

  return matchSet
}

const activityResolver =
  new AZElaborationActivityResolver(
    new DefaultActiveGoalResolver(),
    identifierStates,
  )

function makeElaborationResult() {
  return {
    waterfall: {
      createdInstantiations: [],
      retractedInstantiations: [],
      innerCycleCount: 0,
      highestActiveGoal: null,
      highestActiveLevel: 0,
      nextChangeLevel: 0,
    },
  }
}

const propose =
  activityResolver.resolve(
    'PROPOSE',
    stack.top,
    makeMatchSet(
      'I_ASSERTION',
      lowerGoal,
    ),
  )

assert.equal(
  propose.status,
  'ACTIVE',
)

if (propose.status === 'ACTIVE') {
  assert.equal(
    propose.activeGoal?.goal,
    lowerGoal,
  )

  assert.equal(
    propose.activeLevel,
    2,
  )

  assert.equal(
    propose.firingType,
    'IE_PRODS',
  )
}

const applyQuiescent =
  activityResolver.resolve(
    'APPLY',
    stack.top,
    new AZMatchSet(),
  )

assert.deepEqual(
  applyQuiescent,
  {
    status: 'QUIESCENT',
  },
)

const applyO =
  activityResolver.resolve(
    'APPLY',
    stack.top,
    makeMatchSet(
      'O_ASSERTION',
      topGoal,
    ),
  )

assert.equal(
  applyO.status,
  'ACTIVE',
)

if (applyO.status === 'ACTIVE') {
  assert.equal(
    applyO.activeGoal?.goal,
    topGoal,
  )

  assert.equal(
    applyO.activeLevel,
    1,
  )

  assert.equal(
    applyO.firingType,
    'PE_PRODS',
  )
}

const applyI =
  activityResolver.resolve(
    'APPLY',
    stack.top,
    makeMatchSet(
      'I_ASSERTION',
      topGoal,
    ),
  )

assert.equal(
  applyI.status,
  'ACTIVE',
)

if (applyI.status === 'ACTIVE') {
  assert.equal(
    applyI.firingType,
    'IE_PRODS',
  )
}

//
// Convergence:
// quiescent before execution.
//
{
  let consistencyCalls = 0
  let cycleCalls = 0

  const runner =
    new AZElaborationConvergenceRunner(
      {
        resolve: () => ({
          status: 'QUIESCENT',
        }),
      },
      {
        execute: () => {
          cycleCalls += 1
          return makeElaborationResult()
        },
      },
      new AZMatchSet(),
      stack,
      {
        process: () => {
          consistencyCalls += 1
          return true
        },
      },
    )

  const result =
    runner.executeStep('PROPOSE')

  assert.equal(
    result.executed,
    false,
  )

  assert.equal(
    result.continuePhase,
    true,
  )

  assert.equal(
    result.elaboration,
    null,
  )

  assert.equal(
    cycleCalls,
    0,
  )

  assert.equal(
    consistencyCalls,
    1,
  )
}

//
// Active before, quiescent after.
//
{
  let resolveCalls = 0
  let consistencyCalls = 0

  const elaboration = {
    ...makeElaborationResult(),
    marker: 'executed',
  }

  const cycle:
    AZElaborationCyclePort = {
      execute: (
        _matchSet,
        activeGoal,
        activeLevel,
        phase,
        firingType,
      ) => {
        assert.equal(
          activeGoal?.goal,
          topGoal,
        )

        assert.equal(
          activeLevel,
          1,
        )

        assert.equal(
          phase,
          'APPLY',
        )

        assert.equal(
          firingType,
          'PE_PRODS',
        )

        return elaboration
      },
    }

  const runner =
    new AZElaborationConvergenceRunner(
      {
        resolve: () => {
          resolveCalls += 1

          if (resolveCalls === 1) {
            return {
              status: 'ACTIVE',
              activeGoal: stack.top,
              activeLevel: 1,
              firingType: 'PE_PRODS',
            } as const
          }

          return {
            status: 'QUIESCENT',
          } as const
        },
      },
      cycle,
      new AZMatchSet(),
      stack,
      {
        process: () => {
          consistencyCalls += 1
          return false
        },
      },
    )

  const result =
    runner.executeStep('APPLY')

  assert.equal(
    result.executed,
    true,
  )

  assert.equal(
    result.continuePhase,
    false,
  )

  assert.equal(
    result.elaboration,
    elaboration,
  )

  assert.equal(
    resolveCalls,
    2,
  )

  assert.equal(
    consistencyCalls,
    1,
  )
}

//
// Activity remains after execution.
//
{
  let consistencyCalls = 0

  const runner =
    new AZElaborationConvergenceRunner(
      {
        resolve: () => ({
          status: 'ACTIVE',
          activeGoal: stack.top,
          activeLevel: 1,
          firingType: 'IE_PRODS',
        }),
      },
      {
        execute: () => ({
          ...makeElaborationResult(),
          marker: 'continue',
        }),
      },
      new AZMatchSet(),
      stack,
      {
        process: () => {
          consistencyCalls += 1
          return false
        },
      },
    )

  const result =
    runner.executeStep('PROPOSE')

  assert.equal(
    result.executed,
    true,
  )

  assert.equal(
    result.continuePhase,
    true,
  )

  assert.equal(
    consistencyCalls,
    0,
  )
}

//
// Active-level history is phase-scoped.
// PROPOSE level 2 must not be interpreted as a
// HIGHER_LEVEL transition when APPLY starts at level 1.
//
{
  let consistencyCalls = 0
  const fired: string[] = []
  let activeLevel = 2

  const runner =
    new AZElaborationConvergenceRunner(
      {
        resolve: () => ({
          status: 'ACTIVE',
          activeGoal: stack.top,
          activeLevel,
          firingType: 'IE_PRODS',
        }),
      },
      {
        execute: (
          _matchSet,
          _activeGoal,
          level,
          phase,
        ) => {
          fired.push(`${phase}:${level}`)
          return makeElaborationResult()
        },
      },
      new AZMatchSet(),
      stack,
      {
        process: () => {
          consistencyCalls += 1
          return false
        },
      },
    )

  runner.executeStep('PROPOSE')

  activeLevel = 1

  runner.executeStep('APPLY')

  assert.deepEqual(
    fired,
    ['PROPOSE:2', 'APPLY:1'],
  )

  assert.equal(
    consistencyCalls,
    0,
  )
}
//
// APPLY halt boundary:
// the elaboration that fires halt is completed, but no subsequent
// APPLY elaboration may begin.
//
{
  let cycleCalls = 0
  let halted = false

  const runner =
    new AZElaborationConvergenceRunner(
      {
        resolve: () => ({
          status: 'ACTIVE',
          activeGoal: stack.top,
          activeLevel: 1,
          firingType: 'PE_PRODS',
        }),
      },
      {
        execute: () => {
          cycleCalls += 1
          halted = true
          return makeElaborationResult()
        },
      },
      new AZMatchSet(),
      stack,
      {
        process: () => false,
      },
      {
        isHalted: () => halted,
      },
    )

  const result =
    runner.executeStep('APPLY')

  assert.equal(cycleCalls, 1)
  assert.equal(result.executed, true)
  assert.equal(
    result.continuePhase,
    false,
    'halt during APPLY must terminate APPLY after the current elaboration',
  )
}
// Historical convergence residues: quiescence without invalidation,
// and post-elaboration quiescence with invalidation.
{
  const runner = new AZElaborationConvergenceRunner(
    { resolve: () => ({ status: 'QUIESCENT' as const }) },
    { execute: () => { throw new Error('quiescent convergence must not elaborate') } },
    new AZMatchSet(),
    stack,
    { process: () => false },
  )

  const result = runner.executeStep('APPLY')
  assert.equal(result.executed, false)
  assert.equal(result.continuePhase, false)
  assert.equal(result.elaboration, null)
}

{
  let resolveCalls = 0
  const elaboration = makeElaborationResult()

  const runner = new AZElaborationConvergenceRunner(
    {
      resolve: () => {
        resolveCalls += 1
        return resolveCalls === 1
          ? {
              status: 'ACTIVE' as const,
              activeGoal: stack.top,
              activeLevel: 1,
              firingType: 'PE_PRODS' as const,
            }
          : { status: 'QUIESCENT' as const }
      },
    },
    { execute: () => elaboration },
    new AZMatchSet(),
    stack,
    { process: () => true },
  )

  const result = runner.executeStep('APPLY')
  assert.equal(result.executed, true)
  assert.equal(result.continuePhase, true)
  assert.equal(result.elaboration, elaboration)
  assert.equal(resolveCalls, 2)
}
console.log(
  'AZ elaboration activity and convergence: OK',
)

//
// PROPOSE HIGHER_LEVEL reference semantics:
// when activity moves from a deeper goal to a higher goal,
// consistency is checked only through the new active goal.
//
{
  let activeGoal = stack.findByGoal(lowerGoal)
  let activeLevel = 2
  let globalConsistencyCalls = 0
  const throughGoals: unknown[] = []

  assert.notEqual(activeGoal, null)

  const runner =
    new AZElaborationConvergenceRunner(
      {
        resolve: () => ({
          status: 'ACTIVE',
          activeGoal,
          activeLevel,
          firingType: 'IE_PRODS',
        }),
      },
      {
        execute: () =>
          makeElaborationResult(),
      },
      new AZMatchSet(),
      stack,
      {
        process: () => {
          globalConsistencyCalls += 1
          return false
        },

        processThrough: (goal) => {
          throughGoals.push(goal)
          return false
        },
      },
    )

  runner.executeStep('PROPOSE')

  activeGoal = stack.top
  activeLevel = 1

  runner.executeStep('PROPOSE')

  assert.equal(
    globalConsistencyCalls,
    0,
    'AZ PROPOSE HIGHER_LEVEL must limit consistency checking to the new active goal',
  )

  assert.deepEqual(
    throughGoals,
    [topGoal],
    'AZ PROPOSE HIGHER_LEVEL must check consistency through the new active goal',
  )
}

// APPLY HIGHER_LEVEL reference semantics:
// if the decision becomes inconsistent before firing at the higher goal,
// APPLY must terminate so the top-level controller advances to OUTPUT.
{
  let activeGoal = stack.findByGoal(lowerGoal)
  let activeLevel = 2
  const fired: number[] = []
  const throughGoals: unknown[] = []

  assert.notEqual(activeGoal, null)

  const runner =
    new AZElaborationConvergenceRunner(
      {
        resolve: () => ({
          status: 'ACTIVE',
          activeGoal,
          activeLevel,
          firingType: 'IE_PRODS',
        }),
      },
      {
        execute: (
          _matchSet,
          _activeGoal,
          level,
        ) => {
          fired.push(level)
          return makeElaborationResult()
        },
      },
      new AZMatchSet(),
      stack,
      {
        process: () => false,
        processThrough: (goal) => {
          throughGoals.push(goal)
          return true
        },
      },
    )

  const first =
    runner.executeStep('APPLY')

  assert.equal(first.executed, true)
  assert.equal(first.continuePhase, true)

  activeGoal = stack.top
  activeLevel = 1

  const second =
    runner.executeStep('APPLY')

  assert.equal(
    second.executed,
    false,
  )
  assert.equal(
    second.continuePhase,
    false,
    'APPLY HIGHER_LEVEL inconsistency must terminate APPLY and advance to OUTPUT',
  )
  assert.deepEqual(
    throughGoals,
    [topGoal],
  )
  assert.deepEqual(
    fired,
    [2],
    'higher-level productions must not fire after inconsistency',
  )
}


