import type { AZMatchSet } from '../production/AZMatchSet'
import type { AZInnerElaborationWaterfallResult } from './AZInnerElaborationWaterfallEngine'
import type { AZStateStackEntry } from '../state/AZStateStack'
import type {
  AZCognitivePhase,
  AZFiringType,
} from './AZElaborationActivityResolver'

export interface AZElaborationWaterfallPort {
  execute(
    matchSet: AZMatchSet,
    activeGoal: AZStateStackEntry | null,
    activeLevel: number,
    phase: AZCognitivePhase,
    firingType: AZFiringType,
  ): AZInnerElaborationWaterfallResult
}

export interface AZWorkingMemoryPhasePort {
  execute(matchSet: AZMatchSet): void
}

export interface AZElaborationCycleResult {
  readonly waterfall:
    AZInnerElaborationWaterfallResult
}

export class AZElaborationCycle {
  public constructor(
    private readonly waterfall:
      AZElaborationWaterfallPort,

    private readonly workingMemoryPhase:
      AZWorkingMemoryPhasePort,
  ) {}

  public execute(
    matchSet: AZMatchSet,
    activeGoal: AZStateStackEntry | null,
    activeLevel: number,
    phase: AZCognitivePhase,
    firingType: AZFiringType,
  ): AZElaborationCycleResult {
    const waterfall =
      this.waterfall.execute(
        matchSet,
        activeGoal,
        activeLevel,
        phase,
        firingType,
      )

    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-H after waterfall / before WM')
    this.workingMemoryPhase.execute(
      matchSet,
    )

    return {
      waterfall,
    }
  }
}
