import { performance } from 'node:perf_hooks'
import type {
  AZTopLevelPhaseExecutionResult,
} from '../../src/engines/cognitive/az/core/cycle/AZTopLevelPhaseExecutor'

export interface AZC1Metrics {
  phases: number
  completedCycles: number
  innerCycles: number
  createdInstantiations: number
  retractedInstantiations: number
  elapsedMs: number
}

export class AZC1MetricsCollector {
  private phases = 0
  private completedCycles = 0
  private innerCycles = 0
  private createdInstantiations = 0
  private retractedInstantiations = 0

  private startTime = 0
  private endTime = 0

  public start(): void {
    this.startTime = performance.now()
    this.endTime = 0
  }

  public record(
    result: AZTopLevelPhaseExecutionResult,
  ): void {
    this.phases += 1

    if (
      result.executedPhase === 'OUTPUT' &&
      result.nextPhase === 'INPUT'
    ) {
      this.completedCycles += 1
    }

    const waterfall = result.elaboration?.waterfall

    if (waterfall) {
      this.innerCycles += waterfall.innerCycleCount
      this.createdInstantiations +=
        waterfall.createdInstantiations.length
      this.retractedInstantiations +=
        waterfall.retractedInstantiations.length
    }
  }

  public stop(): AZC1Metrics {
    this.endTime = performance.now()

    return {
      phases: this.phases,
      completedCycles: this.completedCycles,
      innerCycles: this.innerCycles,
      createdInstantiations: this.createdInstantiations,
      retractedInstantiations: this.retractedInstantiations,
      elapsedMs: this.endTime - this.startTime,
    }
  }
}
