import assert from 'node:assert/strict'
import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'

const symbols = new AZSymbolManager()
const goals = new AZDefaultGoalStateRegistry()
const goal = symbols.makeIdentifier('S')
goals.registerGoal(goal, 1)

const wme = {
  identifier: goal,
  attribute: symbols.makeStringConstant('superstate'),
  value: symbols.makeStringConstant('nil'),
  acceptable: false,
  timetag: 1,
} as AZWorkingMemoryElement

const token = {
  parent: null,
  workingMemoryElement: null,
} as AZToken

const matcher = new AZDefaultReteTestMatcher(undefined, goals)

assert.equal(goals.isGoal(goal), true)
assert.equal(
  matcher.matches(
    {
      rightFieldNumber: 0,
      type: 'ID_IS_GOAL',
      data: { kind: 'NONE' },
      next: null,
    },
    token,
    wme,
  ),
  true,
)

console.log('AZ RETE goal-id semantics: OK')
