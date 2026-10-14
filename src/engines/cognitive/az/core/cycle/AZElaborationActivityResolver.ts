import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { ActiveGoalResolver } from '../state/ActiveGoalResolver'
import type { AZStateStackEntry } from '../state/AZStateStack'
import type { AZMatchSet } from '../production/AZMatchSet'

export type AZCognitivePhase =
  | 'PROPOSE'
  | 'APPLY'

export type AZFiringType =
  | 'IE_PRODS'
  | 'PE_PRODS'

export type AZElaborationActivityState =
  | {
      readonly status: 'QUIESCENT'
    }
  | {
      readonly status: 'ACTIVE'
      readonly activeGoal:
        AZStateStackEntry | null
      readonly activeLevel: number
      readonly firingType: AZFiringType
    }

export interface AZElaborationActivityResolverPort {
  resolve(
    phase: AZCognitivePhase,
    start: AZStateStackEntry | null,
    matchSet: AZMatchSet,
  ): AZElaborationActivityState
}

export class AZElaborationActivityResolver
  implements AZElaborationActivityResolverPort
{
  public constructor(
    private readonly activeGoalResolver:
      ActiveGoalResolver,

    private readonly identifierStateRegistry:
      AZIdentifierLinkStateRegistry,
  ) {}

  public resolve(
    phase: AZCognitivePhase,
    start: AZStateStackEntry | null,
    matchSet: AZMatchSet,
  ): AZElaborationActivityState {
    if (phase === 'PROPOSE') {
      const activeGoal =
        this.activeGoalResolver.resolve(
          start,
          'PROPOSE',
          matchSet,
          true,
        )

      if (activeGoal === null) {
        return {
          status: 'QUIESCENT',
        }
      }

      return {
        status: 'ACTIVE',
        activeGoal,
        activeLevel:
          this.identifierStateRegistry
            .get(activeGoal.goal)
            .level,
        firingType: 'IE_PRODS',
      }
    }

    if (!matchSet.hasPendingChanges()) {
      return {
        status: 'QUIESCENT',
      }
    }

    const activeGoal =
      this.activeGoalResolver.resolve(
        start,
        'APPLY',
        matchSet,
        true,
      )

    if (activeGoal === null) {
      return {
        status: 'ACTIVE',
        activeGoal: null,
        activeLevel: 0,
        firingType: 'IE_PRODS',
      }
    }

    const goal =
      activeGoal.goal

    const hasIActivity =
      matchSet.hasAssertion(
        'I_ASSERTION',
        goal,
      ) ||
      matchSet.hasRetraction(goal)

    return {
      status: 'ACTIVE',
      activeGoal,
      activeLevel:
        this.identifierStateRegistry
          .get(goal)
          .level,
      firingType:
        hasIActivity
          ? 'IE_PRODS'
          : 'PE_PRODS',
    }
  }
}
