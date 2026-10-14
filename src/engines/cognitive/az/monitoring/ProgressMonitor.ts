import type { CycleObservation } from './CycleObservation'
import type { CycleObservationHandler } from './CycleObservationHandler'

export type TrajectoryDynamics =
  | 'STABLE'
  | 'CHANGING'
  | 'REPEATING'
  | 'OSCILLATING'

export type ProgressAssessment =
  | 'PROGRESS'
  | 'NO_PROGRESS'
  | 'UNKNOWN'

export type NonProgressCause =
  | 'STRUCTURAL_STABILITY'
  | 'STRUCTURAL_REPETITION'
  | 'STRUCTURAL_OSCILLATION'
  | 'GROWING_ONC_RECURSION'

export class ProgressMonitor
  implements CycleObservationHandler
{
  private readonly structuralStates:
    string[] = []

  private readonly observations:
    CycleObservation[] = []

  private lastObservation:
    CycleObservation | null = null

  public handle(
    observation: CycleObservation,
  ): void {
    this.observations.push(
      observation,
    )

    this.structuralStates.push(
      observation.structuralState,
    )

    this.lastObservation =
      observation
  }

  public getTrajectoryDynamics():
    TrajectoryDynamics {
    const count =
      this.structuralStates.length

    if (count < 2) {
      return 'STABLE'
    }

    const current =
      this.structuralStates[count - 1]

    const previous =
      this.structuralStates[count - 2]

    if (current === previous) {
      return 'STABLE'
    }

    if (
      count >= 4 &&
      current ===
        this.structuralStates[count - 3] &&
      previous ===
        this.structuralStates[count - 4]
    ) {
      return 'OSCILLATING'
    }

    if (
      this.structuralStates
        .slice(0, -1)
        .includes(current)
    ) {
      return 'REPEATING'
    }

    return 'CHANGING'
  }

  public getProgressAssessment():
    ProgressAssessment {
    if (this.lastObservation === null) {
      return 'UNKNOWN'
    }

    if (
      this.lastObservation.outputProduced
    ) {
      return 'PROGRESS'
    }

    if (
      this.structuralStates.length < 2
    ) {
      return 'UNKNOWN'
    }

    if (this.observations.length >= 4) {
      const recent =
        this.observations.slice(-4)

      const growingOnc =
        recent.every(
          (observation, index) =>
            observation.impasseType === 'ONC' &&
            observation.currentOperatorId === null &&
            !observation.outputProduced &&
            (
              index === 0 ||
              observation.goalDepth >
                recent[index - 1]!.goalDepth
            ),
        )

      if (growingOnc) {
        return 'NO_PROGRESS'
      }
    }
    const dynamics =
      this.getTrajectoryDynamics()

    if (dynamics === 'CHANGING') {
      return 'UNKNOWN'
    }

    return 'NO_PROGRESS'
  }

  public getNonProgressCause():
    NonProgressCause | null {
    if (
      this.getProgressAssessment() !==
        'NO_PROGRESS'
    ) {
      return null
    }

    if (this.observations.length >= 4) {
      const recent =
        this.observations.slice(-4)

      const growingOnc =
        recent.every(
          (observation, index) =>
            observation.impasseType === 'ONC' &&
            observation.currentOperatorId === null &&
            !observation.outputProduced &&
            (
              index === 0 ||
              observation.goalDepth >
                recent[index - 1]!.goalDepth
            ),
        )

      if (growingOnc) {
        return 'GROWING_ONC_RECURSION'
      }
    }

    const dynamics =
      this.getTrajectoryDynamics()

    if (dynamics === 'STABLE') {
      return 'STRUCTURAL_STABILITY'
    }

    if (dynamics === 'REPEATING') {
      return 'STRUCTURAL_REPETITION'
    }

    if (dynamics === 'OSCILLATING') {
      return 'STRUCTURAL_OSCILLATION'
    }

    return null
  }
}

