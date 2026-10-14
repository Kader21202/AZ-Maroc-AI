import type { AZMatchSet } from '../production/AZMatchSet'
import type { AZElaborationCycleResult } from './AZElaborationCycle'
import type {
  AZStateStack,
  AZStateStackEntry,
} from '../state/AZStateStack'
import type {
  AZCognitivePhase,
  AZElaborationActivityResolverPort,
  AZFiringType,
} from './AZElaborationActivityResolver'

export interface AZElaborationCyclePort {
  execute(
    matchSet: AZMatchSet,
    activeGoal: AZStateStackEntry | null,
    activeLevel: number,
    phase: AZCognitivePhase,
    firingType: AZFiringType,
  ): AZElaborationCycleResult
}

export interface AZCognitiveRunControlPort {
  isHalted(): boolean
}

export interface AZContextDecisionConsistencyProcessorPort {
  process(): boolean
  processThrough?(goal: AZStateStackEntry['goal']): boolean
}

export interface AZElaborationConvergenceStepResult {
  readonly phase: AZCognitivePhase
  readonly executed: boolean
  readonly continuePhase: boolean
  readonly elaboration:
    AZElaborationCycleResult | null
}

export class AZElaborationConvergenceRunner {
  private previousActivity:
    {
      readonly phase: AZCognitivePhase
      readonly activeLevel: number
      readonly activeGoal: AZStateStackEntry | null
    } | null = null

  public constructor(
    private readonly activityResolver:
      AZElaborationActivityResolverPort,

    private readonly elaborationCycle:
      AZElaborationCyclePort,

    private readonly matchSet:
      AZMatchSet,

    private readonly stateStack:
      AZStateStack,

    private readonly consistencyProcessor:
      AZContextDecisionConsistencyProcessorPort,

    private readonly runControl?:
      AZCognitiveRunControlPort,
  ) {}

  public executeStep(
    phase: AZCognitivePhase,
  ): AZElaborationConvergenceStepResult {
    const activityBefore =
      this.activityResolver.resolve(
        phase,
        this.stateStack.top,
        this.matchSet,
      )


    if (
      activityBefore.status ===
      'QUIESCENT'
    ) {
      this.previousActivity = null

      const invalidated =
        this.consistencyProcessor.process()

      return {
        phase,
        executed: false,
        continuePhase: invalidated,
        elaboration: null,
      }
    }

    const previousActivity =
      this.previousActivity

    if (
      previousActivity !== null &&
      previousActivity.phase === phase &&
      previousActivity.activeLevel >
        activityBefore.activeLevel
    ) {
      const invalidated =
        activityBefore.activeGoal !== null &&
        this.consistencyProcessor.processThrough !== undefined
          ? this.consistencyProcessor.processThrough(
              activityBefore.activeGoal.goal,
            )
          : this.consistencyProcessor.process()

      if (invalidated) {
        this.previousActivity = null

        return {
          phase,
          executed: false,
          continuePhase:
            phase === 'PROPOSE',
          elaboration: null,
        }
      }
    }

    if (
      previousActivity !== null &&
      previousActivity.phase === phase &&
      phase === 'PROPOSE' &&
      previousActivity.activeLevel <
        activityBefore.activeLevel &&
      previousActivity.activeGoal !== null &&
      this.consistencyProcessor.processThrough !== undefined
    ) {
      const invalidated =
        this.consistencyProcessor.processThrough(
          previousActivity.activeGoal.goal,
        )

      if (invalidated) {
        this.previousActivity = null
        return {
          phase,
          executed: false,
          continuePhase: false,
          elaboration: null,
        }
      }
    }

    this.previousActivity = {
      phase,
      activeLevel:
        activityBefore.activeLevel,
      activeGoal: activityBefore.activeGoal,
    }

    const elaboration =
      this.elaborationCycle.execute(
        this.matchSet,
        activityBefore.activeGoal,
        activityBefore.activeLevel,
        phase,
        activityBefore.firingType,
      )

    if (this.runControl?.isHalted() === true) {
      this.previousActivity = null

      return {
        phase,
        executed: true,
        continuePhase: false,
        elaboration,
      }
    }

    const activityAfter =
      this.activityResolver.resolve(
        phase,
        this.stateStack.top,
        this.matchSet,
      )


    if (
      activityAfter.status ===
      'QUIESCENT'
    ) {
      this.previousActivity = null

      const invalidated =
        this.consistencyProcessor.process()

      return {
        phase,
        executed: true,
        continuePhase: invalidated,
        elaboration,
      }
    }

    return {
      phase,
      executed: true,
      continuePhase: true,
      elaboration,
    }
  }
}
