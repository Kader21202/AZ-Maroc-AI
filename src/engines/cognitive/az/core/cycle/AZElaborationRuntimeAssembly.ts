import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWmeCausalProvenanceRegistry } from '../AZWmeCausalProvenanceRegistry'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import {
  AZAcceptablePreferenceWmeChangesProcessor,
  AZAcceptablePreferenceWmeSynchronizer,
} from '../memory/AZAcceptablePreferenceWmeSynchronizer'
import {
  AZAcceptablePreferenceWmeRegistry,
} from '../memory/AZAcceptablePreferenceWmeRegistry'
import type {
  AZIdentifierLinkStateRegistry,
} from '../state/AZIdentifierLinkStateRegistry'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type {
  AZSymbolManager,
} from '../symbols/AZSymbolManager'
import type {
  AZRhsFunctionRegistry,
} from '../production/AZRhsFunctionRegistry'
import {
  AZInstantiationFiringEngine,
} from '../production/AZInstantiationFiringEngine'
import { AZSubstateResultDetector } from '../production/AZSubstateResultDetector'
import { AZSubstateGroundExtractor } from '../production/AZSubstateGroundExtractor'
import { AZJustificationMaterializer } from '../production/AZJustificationMaterializer'
import { AZJustificationInstantiationCreator } from '../production/AZJustificationInstantiationCreator'
import { AZSubstateJustificationHandler } from '../production/AZSubstateJustificationHandler'
import { AZCausalRuleGeneralizer } from '../learning/AZCausalRuleGeneralizer'
import { AZExperientialLearningHandler } from '../learning/AZExperientialLearningHandler'
import { AZJustificationLearningBridge } from '../learning/AZJustificationLearningBridge'
import type { AZGoalIdentityRegistry } from '../state/AZGoalIdentityRegistry'
import type { AZProductionInstaller } from '../production/AZProductionInstaller'
import {
  AZNewPreferenceAsserter,
} from '../production/AZNewPreferenceAsserter'
import {
  AZInstantiationRetractor,
} from '../production/AZInstantiationRetractor'
import type {
  AZNonContextSlotsDecider,
} from '../decision/AZNonContextSlotDecider'
import {
  AZBufferedLinkChangesProcessor,
} from '../decision/AZBufferedLinkChangesProcessor'
import {
  AZWorkingMemoryChangesApplier,
} from '../decision/AZWorkingMemoryChangesApplier'
import {
  DefaultActiveGoalResolver,
} from '../state/DefaultActiveGoalResolver'
import {
  AZWorkingMemoryPhase,
} from '../phases/AZWorkingMemoryPhase'
import {
  AZInnerElaborationWaterfallEngine,
} from './AZInnerElaborationWaterfallEngine'
import {
  AZElaborationCycle,
} from './AZElaborationCycle'

export interface AZElaborationRuntimeAssemblyDependencies {
  readonly symbolManager:
    AZSymbolManager

  readonly identifierStateRegistry:
    AZIdentifierLinkStateRegistry

  readonly structuralRegistry?:
    AZGoalStructuralStateRegistry

  readonly preferenceMemory:
    AZPreferenceMemory

  readonly workingMemory:
    AZWorkingMemory

  readonly nonContextSlotsDecider:
    AZNonContextSlotsDecider

  readonly bufferedLinkChangesProcessor:
    AZBufferedLinkChangesProcessor

  readonly rhsFunctionRegistry?:
    AZRhsFunctionRegistry | null

  readonly acceptablePreferenceWmeRegistry?:
    AZAcceptablePreferenceWmeRegistry

  readonly causalProvenanceRegistry?:
    AZWmeCausalProvenanceRegistry

  readonly goalIdentityRegistry?:
    AZGoalIdentityRegistry

  readonly productionInstaller?:
    AZProductionInstaller

  readonly experientialLearningEnabled?: boolean
}

/**
 * Composition root for the AZ elaboration path.
 *
 * The assembly deliberately reuses the caller's
 * shared memories and identifier state instead of
 * creating parallel cognitive state.
 */
export class AZElaborationRuntimeAssembly {
  public readonly acceptablePreferenceWmeRegistry:
    AZAcceptablePreferenceWmeRegistry

  public readonly firingEngine:
    AZInstantiationFiringEngine

  public readonly newPreferenceAsserter:
    AZNewPreferenceAsserter

  public readonly instantiationRetractor:
    AZInstantiationRetractor

  public readonly waterfall:
    AZInnerElaborationWaterfallEngine

  public readonly workingMemoryPhase:
    AZWorkingMemoryPhase

  public readonly elaborationCycle:
    AZElaborationCycle

  public constructor(
    dependencies:
      AZElaborationRuntimeAssemblyDependencies,
  ) {
    const {
      symbolManager,
      identifierStateRegistry,
      preferenceMemory,
      workingMemory,
      nonContextSlotsDecider,
      bufferedLinkChangesProcessor,
      rhsFunctionRegistry = null,
    } = dependencies

    const completedInstantiationHandler =
      dependencies.goalIdentityRegistry !== undefined &&
      dependencies.causalProvenanceRegistry !== undefined &&
      dependencies.productionInstaller !== undefined
        ? new AZSubstateJustificationHandler(
            new AZSubstateResultDetector(
              dependencies.goalIdentityRegistry,
            ),
            new AZSubstateGroundExtractor(
              dependencies.causalProvenanceRegistry,
              identifierStateRegistry,
              dependencies.structuralRegistry,
            ),
            new AZJustificationMaterializer(),
            dependencies.productionInstaller,
            new AZJustificationInstantiationCreator(
              dependencies.goalIdentityRegistry,
            ),
          )
        : undefined

    this.firingEngine =
      new AZInstantiationFiringEngine(
        symbolManager,
        identifierStateRegistry,
        rhsFunctionRegistry,
        undefined,
        dependencies.experientialLearningEnabled === true &&
        completedInstantiationHandler !== undefined &&
        dependencies.productionInstaller !== undefined
          ? new AZJustificationLearningBridge(
              completedInstantiationHandler,
              new AZExperientialLearningHandler(
                new AZCausalRuleGeneralizer(symbolManager),
                dependencies.productionInstaller,
              ),
              true,
            )
          : completedInstantiationHandler,
      )

    this.newPreferenceAsserter =
      new AZNewPreferenceAsserter(
        preferenceMemory,
      )

    this.instantiationRetractor =
      new AZInstantiationRetractor(
        preferenceMemory,
      )

    this.waterfall =
      new AZInnerElaborationWaterfallEngine(
        this.firingEngine,
        this.newPreferenceAsserter,
        new DefaultActiveGoalResolver(),
        this.instantiationRetractor,
        identifierStateRegistry,
      )

    this.acceptablePreferenceWmeRegistry =
      dependencies
        .acceptablePreferenceWmeRegistry ??
      new AZAcceptablePreferenceWmeRegistry(
        dependencies.causalProvenanceRegistry,
      )

    const acceptablePreferenceWmeSynchronizer =
      new AZAcceptablePreferenceWmeSynchronizer(
        this.acceptablePreferenceWmeRegistry,
      )

    const workingMemoryChangesApplier =
      new AZWorkingMemoryChangesApplier(
        bufferedLinkChangesProcessor,
      )

    this.workingMemoryPhase =
      new AZWorkingMemoryPhase(
        preferenceMemory,
        workingMemory,
        new AZAcceptablePreferenceWmeChangesProcessor(),
        acceptablePreferenceWmeSynchronizer,
        nonContextSlotsDecider,
        workingMemoryChangesApplier,
      )

    this.elaborationCycle =
      new AZElaborationCycle(
        this.waterfall,
        this.workingMemoryPhase,
      )
  }
}
