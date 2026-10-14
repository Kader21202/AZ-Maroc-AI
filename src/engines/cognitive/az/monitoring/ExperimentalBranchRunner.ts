import type {
  ExperimentalBranchObservation,
  ExperimentalBranchResult,
  ExperimentalBranchRun,
} from './ExperimentalBranch'

export class ExperimentalBranchRunner {
  public run(
    branch: ExperimentalBranchRun,
  ): ExperimentalBranchResult {
    if (
      !Number.isInteger(branch.horizonCycles) ||
      branch.horizonCycles < 1
    ) {
      throw new Error(
        'Experimental branch horizon must be a positive integer number of completed continuation cycles',
      )
    }

    const runtime =
      branch.runtime

    branch.intervention.apply(runtime)

    runtime.elaborationRuntime
      .workingMemoryPhase
      .execute(
        runtime.productionRuntime.matchSet,
      )

    const observations:
      ExperimentalBranchObservation[] = []

    let completedCycles = 0
    let step = 0

    while (
      completedCycles <
      branch.horizonCycles
    ) {
      if (runtime.runControl.isHalted()) {
        return {
          observations,
          stoppingReason: 'HALTED',
        }
      }

      const phase =
        runtime.phaseRuntime
          .phaseExecutor
          .executeOnePhase()

      observations.push({
        step,
        phase,
      })

      step += 1

      if (
        phase.executedPhase === 'OUTPUT' &&
        phase.nextPhase === 'INPUT'
      ) {
        completedCycles += 1
      }

      if (runtime.runControl.isHalted()) {
        return {
          observations,
          stoppingReason: 'HALTED',
        }
      }
    }

    return {
      observations,
      stoppingReason: 'HORIZON',
    }
  }
}
