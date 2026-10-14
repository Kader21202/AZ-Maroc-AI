import assert from 'node:assert/strict'

import {
  AZDefaultTopLevelPhaseController,
} from '../../src/engines/cognitive/az/core/cycle/AZTopLevelPhaseController'
import {
  AZTopLevelPhaseExecutor,
} from '../../src/engines/cognitive/az/core/cycle/AZTopLevelPhaseExecutor'
import {
  AZIoState,
} from '../../src/engines/cognitive/az/core/io/AZIoState'
import {
  AZOutputLinkManager,
} from '../../src/engines/cognitive/az/core/io/AZOutputLinkManager'

const calls: string[] = []

const controller =
  new AZDefaultTopLevelPhaseController()

const outputLinkManager =
  new AZOutputLinkManager(
    new AZIoState(),
  )

let proposeStep = 0
let applyStep = 0

function makeElaborationResult(
  innerCycleCount: number,
) {
  return {
    waterfall: {
      createdInstantiations: [],
      retractedInstantiations: [],
      innerCycleCount,
      highestActiveGoal: null,
      highestActiveLevel: 0,
      nextChangeLevel: 0,
    },
  }
}

const executor =
  new AZTopLevelPhaseExecutor(
    controller,
    {
      execute() {
        calls.push('INPUT')
      },
    },
    {
      executeStep(phase) {
        calls.push(phase)

        if (phase === 'PROPOSE') {
          proposeStep += 1

          return {
            continuePhase:
              proposeStep === 1,
            elaboration:
              makeElaborationResult(
                proposeStep,
              ),
          }
        }

        applyStep += 1

        return {
          continuePhase:
            applyStep === 1,
          elaboration:
            makeElaborationResult(
              applyStep,
            ),
        }
      },
    },
    {
      execute() {
        calls.push('DECIDE')
      },
    },
    {
      execute() {
        calls.push('OUTPUT')
        return []
      },
    },
    outputLinkManager,
  )

const input =
  executor.executeOnePhase()

assert.equal(
  input.executedPhase,
  'INPUT',
)

assert.equal(
  input.nextPhase,
  'PROPOSE',
)

const propose1 =
  executor.executeOnePhase()

assert.equal(
  propose1.executedPhase,
  'PROPOSE',
)

assert.equal(
  propose1.nextPhase,
  'PROPOSE',
)

assert.equal(
  propose1.elaboration
    ?.waterfall
    .innerCycleCount,
  1,
)

const propose2 =
  executor.executeOnePhase()

assert.equal(
  propose2.nextPhase,
  'DECIDE',
)

const decide =
  executor.executeOnePhase()

assert.equal(
  decide.executedPhase,
  'DECIDE',
)

assert.equal(
  decide.nextPhase,
  'APPLY',
)

const apply1 =
  executor.executeOnePhase()

assert.equal(
  apply1.nextPhase,
  'APPLY',
)

assert.equal(
  apply1.elaboration
    ?.waterfall
    .innerCycleCount,
  1,
)

const apply2 =
  executor.executeOnePhase()

assert.equal(
  apply2.nextPhase,
  'OUTPUT',
)

const output =
  executor.executeOnePhase()

assert.equal(
  output.executedPhase,
  'OUTPUT',
)

assert.equal(
  output.nextPhase,
  'INPUT',
)

assert.deepEqual(
  calls,
  [
    'INPUT',
    'PROPOSE',
    'PROPOSE',
    'DECIDE',
    'APPLY',
    'APPLY',
    'OUTPUT',
  ],
)

console.log(
  'AZ autonomous top-level phase cycle: OK',
)
