import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'
import { AZDefaultGoalPreferenceRegistry } from './AZDefaultGoalPreferenceRegistry'
import type { AZGoalPreferenceRegistry } from './AZGoalPreferenceRegistry'
import { AZInstantiationCreator } from './AZInstantiationCreator'
import {
  AZDefaultInstantiationFiringPolicy,
  type AZInstantiationFiringPolicy,
} from './AZInstantiationFiringPolicy'
import type { AZInstantiation } from './AZInstantiation'
import type {
  AZMatchAssertionType,
  AZMatchSet,
} from './AZMatchSet'
import { AZProductionActionExecutor } from './AZProductionActionExecutor'
import { AZDefaultReteParentResolver } from './AZDefaultReteParentResolver'
import type { AZRhsFunctionRegistry } from './AZRhsFunctionRegistry'

export interface AZCompletedInstantiationHandler {
  handle(instantiation: AZInstantiation): readonly AZInstantiation[]
}

export interface AZInstantiationFiringEngineContext {
  readonly activeLevel: number
  readonly highestActiveLevel: number
  readonly changeLevel: number
  readonly nextChangeLevel: number
}

export interface AZInstantiationFiringResult {
  readonly createdInstantiations:
    readonly AZInstantiation[]

  readonly assertionsExisted: boolean
  readonly nextChangeLevel: number
}

export class AZInstantiationFiringEngine {
  private readonly firingPolicy:
    AZInstantiationFiringPolicy

  private readonly instantiationCreator =
    new AZInstantiationCreator(
      new AZDefaultReteParentResolver(),
    )

  private readonly actionExecutor:
    AZProductionActionExecutor

  public readonly goalPreferenceRegistry:
    AZGoalPreferenceRegistry

  public constructor(
    symbolManager: AZSymbolManager,
    identifierStateRegistry:
      AZIdentifierLinkStateRegistry,
    rhsFunctionRegistry:
      AZRhsFunctionRegistry | null = null,
    goalPreferenceRegistry:
      AZGoalPreferenceRegistry =
        new AZDefaultGoalPreferenceRegistry(),
    private readonly completedInstantiationHandler?:
      AZCompletedInstantiationHandler,
  ) {
    this.firingPolicy =
      new AZDefaultInstantiationFiringPolicy(
        identifierStateRegistry,
      )

    this.actionExecutor =
      new AZProductionActionExecutor(
        symbolManager,
        identifierStateRegistry,
        rhsFunctionRegistry,
      )

    this.goalPreferenceRegistry =
      goalPreferenceRegistry
  }

  public fire(
    matchSet: AZMatchSet,
    assertionType: AZMatchAssertionType,
    matchGoal: AZSymbol | null,
    context:
      AZInstantiationFiringEngineContext,
  ): AZInstantiationFiringResult {
    const created: AZInstantiation[] = []
    let assertionsExisted = false
    let nextChangeLevel =
      context.nextChangeLevel

    try {
      for (;;) {
        const assertion =
          matchSet.postponeNextAssertion(
            assertionType,
            matchGoal,
          )

        if (assertion === null) {
          break
        }

        assertionsExisted = true

        const productionNode =
          assertion.token.node

        if (
          productionNode === null ||
          productionNode.type !== 'PRODUCTION'
        ) {
          throw new Error(
            'Match assertion token must belong to a production node',
          )
        }

        const reteToken =
          assertion.token.parent

        if (reteToken === null) {
          throw new Error(
            'Production assertion requires a parent RETE token',
          )
        }

        const shouldCreate =
          this.firingPolicy.shouldCreate(
            assertion.production,
            reteToken,
            assertion.wme,
            {
              activeLevel:
                context.activeLevel,
              highestActiveLevel:
                context.highestActiveLevel,
              changeLevel:
                context.changeLevel,
            },
          )

        if (!shouldCreate) {
          continue
        }

        const consumed =
          matchSet.consumeLastPostponedAssertion()

        if (consumed !== assertion) {
          throw new Error(
            'Consumed postponed assertion does not match firing assertion',
          )
        }

        const instantiation =
          this.instantiationCreator.create(
            assertion.production,
            productionNode,
            reteToken,
            assertion.wme,
            assertion.matchGoal,
            assertion.matchGoalLevel,
          )


        const rhsContext = {
          unboundVariableBindings:
            new Map(),
          assertionType:
            assertion.type,
        } as const

        for (
          const action of
          assertion.production.actions
        ) {
          this.actionExecutor.execute(
            action,
            reteToken,
            assertion.wme,
            instantiation,
            rhsContext,
          )
        }

        const generatedInstantiations =
          this.completedInstantiationHandler?.handle(
            instantiation,
          ) ?? []

        if (
          instantiation.matchGoal !== null &&
          instantiation.matchGoal.type ===
            'IDENTIFIER'
        ) {
          this.goalPreferenceRegistry.add(
            instantiation.matchGoal,
            instantiation.generatedPreferences,
          )
        }

        created.push(instantiation)
        created.push(...generatedInstantiations)
      }
    } finally {
      matchSet.restorePostponedAssertions()
    }

    if (
      assertionsExisted &&
      context.activeLevel > nextChangeLevel
    ) {
      nextChangeLevel =
        context.activeLevel
    }

    return {
      createdInstantiations: created,
      assertionsExisted,
      nextChangeLevel,
    }
  }
}
