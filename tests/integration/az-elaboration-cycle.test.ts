import assert from 'node:assert/strict'
import { AZElaborationCycle } from '../../src/engines/cognitive/az/core/cycle/AZElaborationCycle'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'

const calls: string[] = []
const matchSet = new AZMatchSet()

const waterfallResult = {
  createdInstantiations: [],
  retractedInstantiations: [],
  innerCycleCount: 1,
  highestActiveGoal: null,
  highestActiveLevel: 0,
  nextChangeLevel: 0,
}

const waterfall = {
  execute(): typeof waterfallResult {
    calls.push('waterfall')
    return waterfallResult
  },
}

const workingMemoryPhase = {
  execute(): void {
    calls.push('working-memory')
  },
}

const cycle =
  new AZElaborationCycle(
    waterfall,
    workingMemoryPhase,
  )

const result =
  cycle.execute(
    matchSet,
    null,
    0,
    'PROPOSE',
    'IE_PRODS',
  )

assert.deepEqual(
  calls,
  [
    'waterfall',
    'working-memory',
  ],
  'elaboration must execute waterfall before working-memory phase',
)

assert.equal(
  result.waterfall,
  waterfallResult,
  'elaboration cycle must return the waterfall result unchanged',
)

console.log(
  'AZ elaboration cycle sequencing: OK',
)
