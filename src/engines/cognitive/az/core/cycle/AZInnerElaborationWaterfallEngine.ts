import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { ActiveGoalResolver } from '../state/ActiveGoalResolver'
import type { AZStateStackEntry } from '../state/AZStateStack'
import type { AZInstantiationFiringEngine } from '../production/AZInstantiationFiringEngine'
import type { AZInstantiation } from '../production/AZInstantiation'
import type { AZInstantiationRetractor } from '../production/AZInstantiationRetractor'
import type { AZMatchAssertionType, AZMatchSet } from '../production/AZMatchSet'
import type { AZNewPreferenceAsserter } from '../production/AZNewPreferenceAsserter'
import type {
  AZCognitivePhase,
  AZFiringType,
} from './AZElaborationActivityResolver'

export interface AZInnerElaborationWaterfallResult {
  readonly createdInstantiations:
    readonly AZInstantiation[]

  readonly retractedInstantiations:
    readonly AZInstantiation[]

  readonly innerCycleCount: number

  readonly highestActiveGoal:
    AZStateStackEntry | null

  readonly highestActiveLevel: number

  readonly nextChangeLevel: number
}

export class AZInnerElaborationWaterfallEngine {
  public constructor(
    private readonly firingEngine:
      AZInstantiationFiringEngine,

    private readonly newPreferenceAsserter:
      AZNewPreferenceAsserter,

    private readonly activeGoalResolver:
      ActiveGoalResolver,

    private readonly instantiationRetractor:
      AZInstantiationRetractor,

    private readonly identifierStateRegistry:
      AZIdentifierLinkStateRegistry,
  ) {}

  public execute(
    matchSet: AZMatchSet,
    activeGoal: AZStateStackEntry | null,
    activeLevel: number,
    phase: AZCognitivePhase,
    firingType: AZFiringType,
  ): AZInnerElaborationWaterfallResult {
    if (
      phase === 'PROPOSE' &&
      firingType !== 'IE_PRODS'
    ) {
      throw new Error(
        'PROPOSE phase requires IE_PRODS firing type',
      )
    }

    const highestActiveGoal =
      activeGoal

    const highestActiveLevel =
      activeLevel

    let currentGoal =
      activeGoal

    let currentLevel =
      activeLevel

    let changeLevel =
      highestActiveLevel

    let nextChangeLevel =
      highestActiveLevel

    let innerCycleCount = 0

    const createdInstantiations:
      AZInstantiation[] = []

    for (;;) {
      changeLevel =
        nextChangeLevel

      let createdThisCycle:
        readonly AZInstantiation[] = []

      if (currentGoal !== null) {
        const assertionType:
          AZMatchAssertionType =
            firingType === 'PE_PRODS'
              ? 'O_ASSERTION'
              : 'I_ASSERTION'

        const firingResult =
          this.firingEngine.fire(
            matchSet,
            assertionType,
            currentGoal.goal,
            {
              activeLevel:
                currentLevel,

              highestActiveLevel,

              changeLevel,

              nextChangeLevel,
            },
          )

        createdThisCycle =
          firingResult.createdInstantiations

        nextChangeLevel =
          firingResult.nextChangeLevel

        createdInstantiations.push(
          ...createdThisCycle,
        )

        this.newPreferenceAsserter.assert(
          createdThisCycle,
        )
      }

      innerCycleCount += 1

      if (currentGoal === null) {
        break
      }

      if (currentGoal.lower === null) {
        break
      }

      currentGoal =
        this.activeGoalResolver.resolve(
          currentGoal.lower,
          phase,
          matchSet,
          true,
        )

      if (currentGoal === null) {
        break
      }

      currentLevel =
        this.identifierStateRegistry
          .get(currentGoal.goal)
          .level
    }

    const retractedInstantiations:
      AZInstantiation[] = []

    if (highestActiveGoal !== null) {
      for (;;) {
        const instantiation =
          matchSet.takeNextRetraction(
            highestActiveGoal.goal,
          )

        if (instantiation === null) {
          break
        }

        this.instantiationRetractor.retract(
          instantiation,
        )

        retractedInstantiations.push(
          instantiation,
        )
      }
    }

    for (;;) {
      const instantiation =
        matchSet.takeNextNilGoalRetraction()

      if (instantiation === null) {
        break
      }

      this.instantiationRetractor.retract(
        instantiation,
      )

      retractedInstantiations.push(
        instantiation,
      )
    }


    return {
      createdInstantiations,
      retractedInstantiations,
      innerCycleCount,
      highestActiveGoal,
      highestActiveLevel,
      nextChangeLevel,
    }
  }
}
