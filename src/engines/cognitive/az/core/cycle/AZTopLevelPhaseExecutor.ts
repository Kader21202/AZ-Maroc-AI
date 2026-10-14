import type {
  AZOutputCommand,
} from '../io/AZOutputCommand'
import type {
  AZElaborationCycleResult,
} from './AZElaborationCycle'
import type {
  AZOutputLinkManager,
} from '../io/AZOutputLinkManager'
import type {
  AZTopLevelPhase,
  AZTopLevelPhaseController,
} from './AZTopLevelPhaseController'

export interface AZInputPhasePort {
  execute(): void
}

export interface AZConvergenceStepResult {
  readonly continuePhase: boolean
  readonly elaboration:
    AZElaborationCycleResult | null
}

export interface AZConvergenceRunnerPort {
  executeStep(
    phase: 'PROPOSE' | 'APPLY',
  ): AZConvergenceStepResult
}

export interface AZDecideRuntimePort {
  execute(): void
}

export interface AZOutputPhasePort {
  execute(
    outputLinkManager:
      AZOutputLinkManager,
  ): readonly AZOutputCommand[]
}

export interface AZTopLevelPhaseExecutionResult {
  readonly executedPhase:
    AZTopLevelPhase

  readonly nextPhase:
    AZTopLevelPhase

  readonly outputCommands:
    readonly AZOutputCommand[]

  readonly elaboration?:
    AZElaborationCycleResult | null
}

export class AZTopLevelPhaseExecutor {
  public constructor(
    private readonly controller:
      AZTopLevelPhaseController,

    private readonly inputPhase:
      AZInputPhasePort,

    private readonly convergenceRunner:
      AZConvergenceRunnerPort,

    private readonly decideRuntime:
      AZDecideRuntimePort,

    private readonly outputPhase:
      AZOutputPhasePort,

    private readonly outputLinkManager:
      AZOutputLinkManager,
  ) {}

  public executeOnePhase():
    AZTopLevelPhaseExecutionResult {
    const executedPhase =
      this.controller.currentPhase

    let outputCommands:
      readonly AZOutputCommand[] = []

    let elaboration:
      AZTopLevelPhaseExecutionResult['elaboration'] =
        undefined

    let advancePhase = true

    switch (executedPhase) {
      case 'INPUT':
        this.inputPhase.execute()
        break

      case 'PROPOSE': {
        const result =
          this.convergenceRunner.executeStep(
            'PROPOSE',
          )

        elaboration =
          result.elaboration

        advancePhase =
          !result.continuePhase

        break
      }

      case 'DECIDE':
        this.decideRuntime.execute()
        break

      case 'APPLY': {
        const result =
          this.convergenceRunner.executeStep(
            'APPLY',
          )

        elaboration =
          result.elaboration

        advancePhase =
          !result.continuePhase

        break
      }

      case 'OUTPUT':
        outputCommands =
          this.outputPhase.execute(
            this.outputLinkManager,
          )
        break
    }

    if (advancePhase) {
      this.controller.executeOnePhase()
    }

    return {
      executedPhase,
      nextPhase:
        this.controller.currentPhase,
      outputCommands,
      elaboration,
    }
  }
}
