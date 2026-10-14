import type { AZCognitiveRuntimeAssembly } from '../core/AZCognitiveRuntimeAssembly'
import type { AZTopLevelPhaseExecutionResult } from '../core/cycle/AZTopLevelPhaseExecutor'

export interface ExperimentalBranchIntervention {
  apply(
    runtime: AZCognitiveRuntimeAssembly,
  ): void
}

export interface ExperimentalBranchObservation {
  readonly step: number
  readonly phase:
    AZTopLevelPhaseExecutionResult
}

export interface ExperimentalBranchResult {
  readonly observations:
    readonly ExperimentalBranchObservation[]

  readonly stoppingReason:
    'HORIZON' | 'HALTED'
}

export interface ExperimentalBranchRun {
  readonly runtime:
    AZCognitiveRuntimeAssembly

  readonly horizonCycles: number

  readonly intervention:
    ExperimentalBranchIntervention
}
