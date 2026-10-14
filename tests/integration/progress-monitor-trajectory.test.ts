import assert from 'node:assert/strict'
import type { CycleObservation } from '../../src/engines/cognitive/az/monitoring/CycleObservation'
import { ProgressMonitor } from '../../src/engines/cognitive/az/monitoring/ProgressMonitor'

function observation(
  cycle: number,
  structuralState: string,
  outputProduced = false,
): CycleObservation {
  return {
    cycle,
    currentGoalId: 'G1',
    goalDepth: 1,
    impasseType: null,
    currentOperatorId: null,
    structuralState,
    outputProduced,
    halted: false,
    stopReason: null,
  }
}

function main(): void {
  const stable =
    new ProgressMonitor()

  stable.handle(
    observation(1, 'A'),
  )
  stable.handle(
    observation(2, 'A'),
  )

  assert.equal(
    stable.getTrajectoryDynamics(),
    'STABLE',
  )

  const changing =
    new ProgressMonitor()

  changing.handle(
    observation(1, 'A'),
  )
  changing.handle(
    observation(2, 'B'),
  )

  assert.equal(
    changing.getTrajectoryDynamics(),
    'CHANGING',
  )

  const repeating =
    new ProgressMonitor()

  repeating.handle(
    observation(1, 'A'),
  )
  repeating.handle(
    observation(2, 'B'),
  )
  repeating.handle(
    observation(3, 'C'),
  )
  repeating.handle(
    observation(4, 'B'),
  )

  assert.equal(
    repeating.getTrajectoryDynamics(),
    'REPEATING',
  )

  const oscillating =
    new ProgressMonitor()

  oscillating.handle(
    observation(1, 'A'),
  )
  oscillating.handle(
    observation(2, 'B'),
  )
  oscillating.handle(
    observation(3, 'A'),
  )
  oscillating.handle(
    observation(4, 'B'),
  )

  assert.equal(
    oscillating.getTrajectoryDynamics(),
    'OSCILLATING',
  )

  const unknown =
    new ProgressMonitor()

  unknown.handle(
    observation(1, 'A'),
  )

  assert.equal(
    unknown.getProgressAssessment(),
    'UNKNOWN',
  )

  assert.equal(
    stable.getProgressAssessment(),
    'NO_PROGRESS',
  )

  assert.equal(
    changing.getProgressAssessment(),
    'UNKNOWN',
  )

  assert.equal(
    repeating.getProgressAssessment(),
    'NO_PROGRESS',
  )

  assert.equal(
    oscillating.getProgressAssessment(),
    'NO_PROGRESS',
  )

  const progressing =
    new ProgressMonitor()

  progressing.handle(
    observation(1, 'A'),
  )
  progressing.handle(
    observation(2, 'B', true),
  )

  assert.equal(
    progressing.getProgressAssessment(),
    'PROGRESS',
  )

  const oncGrowth =
    new ProgressMonitor()

  oncGrowth.handle({
    ...observation(1, 'A'),
    currentGoalId: 'G1',
    goalDepth: 1,
    impasseType: 'ONC',
  })
  oncGrowth.handle({
    ...observation(2, 'B'),
    currentGoalId: 'G2',
    goalDepth: 2,
    impasseType: 'ONC',
  })
  oncGrowth.handle({
    ...observation(3, 'C'),
    currentGoalId: 'G3',
    goalDepth: 3,
    impasseType: 'ONC',
  })
  oncGrowth.handle({
    ...observation(4, 'D'),
    currentGoalId: 'G4',
    goalDepth: 4,
    impasseType: 'ONC',
  })

  assert.equal(
    oncGrowth.getTrajectoryDynamics(),
    'CHANGING',
  )

  assert.equal(
    oncGrowth.getProgressAssessment(),
    'NO_PROGRESS',
  )
  assert.equal(
    stable.getNonProgressCause(),
    'STRUCTURAL_STABILITY',
  )

  assert.equal(
    repeating.getNonProgressCause(),
    'STRUCTURAL_REPETITION',
  )

  assert.equal(
    oscillating.getNonProgressCause(),
    'STRUCTURAL_OSCILLATION',
  )

  assert.equal(
    oncGrowth.getNonProgressCause(),
    'GROWING_ONC_RECURSION',
  )

  assert.equal(
    changing.getNonProgressCause(),
    null,
  )

  assert.equal(
    progressing.getNonProgressCause(),
    null,
  )

  console.log(
    'AZ progress-monitor trajectory and progress assessment: OK',
  )
}

main()

