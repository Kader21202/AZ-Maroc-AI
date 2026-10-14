import type {
  CognitiveImpasseType,
} from '../../src/engines/cognitive/az/events/CognitiveEvent'
import type {
  CycleObservation,
} from '../../src/engines/cognitive/az/monitoring/CycleObservation'

function assertCycleObservation(
  observation: CycleObservation,
): CycleObservation {
  return observation
}

const impasseType: CognitiveImpasseType =
  'NO_CHANGE'

const activeObservation =
  assertCycleObservation({
    cycle: 3,
    currentGoalId: 'G3',
    goalDepth: 2,
    impasseType,
    currentOperatorId: 'O7',
    structuralState: 'canonical-state',
    outputProduced: false,
    halted: false,
    stopReason: null,
  })

const haltedObservation =
  assertCycleObservation({
    cycle: 4,
    currentGoalId: null,
    goalDepth: 0,
    impasseType: null,
    currentOperatorId: null,
    structuralState: 'canonical-empty-state',
    outputProduced: true,
    halted: true,
    stopReason: 'completed',
  })

if (
  activeObservation.cycle !== 3 ||
  haltedObservation.stopReason !== 'completed'
) {
  throw new Error(
    'CycleObservation contract validation failed.',
  )
}

console.log(
  'AZ cycle-observation contract: OK',
)
