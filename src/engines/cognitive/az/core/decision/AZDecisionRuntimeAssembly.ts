import type { AZDecideRuntimePort } from '../cycle/AZTopLevelPhaseExecutor'
import type { AZWmeCausalProvenanceRegistry } from '../AZWmeCausalProvenanceRegistry'
import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZMatchSet } from '../production/AZMatchSet'
import { AZImpasseItemInstantiationCreator } from '../production/AZImpasseItemInstantiationCreator'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'
import { AZExistingContextRemover } from '../state/AZExistingContextRemover'
import { AZGoalContextInitializer } from '../state/AZGoalContextInitializer'
import type { AZGoalContextStack } from '../state/AZGoalContextStack'
import type { AZStateStack } from '../state/AZStateStack'
import type { AZContextChangeTracker } from '../state/AZContextChangeTracker'
import type { AZGoalStateRegistry } from '../state/AZGoalStateRegistry'
import type { AZGoalIdentityRegistry } from '../state/AZGoalIdentityRegistry'
import type { AZGoalDepthPolicy } from '../state/AZGoalDepthPolicy'
import type { AZCognitiveRunControl } from '../cycle/AZCognitiveRunControl'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type { AZImpasseStateRegistry } from '../state/AZImpasseStateRegistry'
import { AZLowerContextCreator } from '../state/AZLowerContextCreator'
import type { AZBufferedLinkChangesProcessor } from './AZBufferedLinkChangesProcessor'
import type { AZCandidateSelectionPolicy } from './AZCandidateSelectionPolicy'
import { AZContextDecisionConsistencyChecker } from './AZContextDecisionConsistencyChecker'
import { AZContextPreferenceWmeRegistry } from './AZContextPreferenceWmeRegistry'
import { AZContextDecisionConsistencyProcessor } from './AZContextDecisionConsistencyProcessor'
import { AZCurrentContextDecisionRemover } from './AZCurrentContextDecisionRemover'
import { AZWorkingMemoryChangesApplier } from './AZWorkingMemoryChangesApplier'
import { AZContextSlotDecider } from './AZContextSlotDecider'
import type { AZContextDecisionObserver } from './AZContextDecisionObserver'
import { AZContextSlotsDecider } from './AZContextSlotsDecider'
import { AZContextSlotWmeRemover } from './AZContextSlotWmeRemover'
import { AZDefaultContextPreferenceSemantics } from './AZDefaultContextPreferenceSemantics'
import { AZDefaultContextSlotDecidability } from './AZDefaultContextSlotDecidability'
import { AZImpasseItemBacktraceRegistry } from './AZImpasseItemBacktraceRegistry'
import { AZImpasseItemsUpdater } from './AZImpasseItemsUpdater'
import { AZNonContextPreferenceSemantics } from './AZNonContextPreferenceSemantics'
import { AZNonContextPreferenceWmeRegistry } from './AZNonContextPreferenceWmeRegistry'
import { AZNonContextSlotDecider, AZNonContextSlotsDecider } from './AZNonContextSlotDecider'

export interface AZDecisionRuntimeAssemblyDependencies {
  readonly symbolManager:
    AZSymbolManager

  readonly predefinedSymbols:
    AZPredefinedSymbols

  readonly preferenceMemory:
    AZPreferenceMemory

  readonly workingMemory:
    AZWorkingMemory

  readonly matchSet:
    AZMatchSet

  readonly contextStack:
    AZGoalContextStack

  readonly stateStack:
    AZStateStack

  readonly contextChangeTracker:
    AZContextChangeTracker

  readonly goalStateRegistry:
    AZGoalStateRegistry


  readonly goalIdentityRegistry:
    AZGoalIdentityRegistry
  readonly identifierStateRegistry:
    AZIdentifierLinkStateRegistry

  readonly structuralRegistry:
    AZGoalStructuralStateRegistry

  readonly impasseRegistry:
    AZImpasseStateRegistry

  readonly bufferedLinkChangesProcessor:
    AZBufferedLinkChangesProcessor

  readonly causalProvenanceRegistry?:
    AZWmeCausalProvenanceRegistry

  readonly contextDecisionObserver?:
    AZContextDecisionObserver

  readonly candidateSelectionPolicy?:
    AZCandidateSelectionPolicy

  readonly goalDepthPolicy?:
    AZGoalDepthPolicy

  readonly runControl?:
    AZCognitiveRunControl
}

export class AZDecisionRuntime
  implements AZDecideRuntimePort
{
  public constructor(
    private readonly contextSlotsDecider:
      AZContextSlotsDecider,

    private readonly preferenceMemory:
      AZPreferenceMemory,

    private readonly workingMemory:
      AZWorkingMemory,

    private readonly matchSet:
      AZMatchSet,

    private readonly workingMemoryChangesApplier:
      AZWorkingMemoryChangesApplier,
  ) {}

  public execute(): void {
    this.contextSlotsDecider.decideAll(
      this.preferenceMemory,
      this.workingMemory,
      this.matchSet,
    )

    this.workingMemoryChangesApplier.apply(
      this.preferenceMemory,
      this.workingMemory,
    )
  }
}

/**
 * Composition root for AZ preference decision.
 *
 * All goal, context, impasse and memory state is
 * supplied by the caller so that decision shares
 * the same state as the rest of the cognitive
 * runtime.
 */
export class AZDecisionRuntimeAssembly {
  public readonly contextPreferenceWmeRegistry:
    AZContextPreferenceWmeRegistry

  public readonly contextSlotWmeRemover:
    AZContextSlotWmeRemover

  public readonly goalContextInitializer:
    AZGoalContextInitializer

  public readonly lowerContextCreator:
    AZLowerContextCreator

  public readonly existingContextRemover:
    AZExistingContextRemover

  public readonly impasseItemBacktraceRegistry:
    AZImpasseItemBacktraceRegistry

  public readonly impasseItemInstantiationCreator:
    AZImpasseItemInstantiationCreator

  public readonly impasseItemsUpdater:
    AZImpasseItemsUpdater

  public readonly nonContextPreferenceSemantics:
    AZNonContextPreferenceSemantics

  public readonly nonContextPreferenceWmeRegistry:
    AZNonContextPreferenceWmeRegistry

  public readonly nonContextSlotDecider:
    AZNonContextSlotDecider

  public readonly contextPreferenceSemantics:
    AZDefaultContextPreferenceSemantics

  public readonly contextDecisionConsistencyChecker:
    AZContextDecisionConsistencyChecker

  public readonly currentContextDecisionRemover:
    AZCurrentContextDecisionRemover

  public readonly workingMemoryChangesApplier:
    AZWorkingMemoryChangesApplier

  public readonly consistencyProcessor:
    AZContextDecisionConsistencyProcessor

  public readonly contextSlotDecider:
    AZContextSlotDecider

  public readonly contextSlotsDecider:
    AZContextSlotsDecider

  public readonly nonContextSlotsDecider:
    AZNonContextSlotsDecider

  public readonly decideRuntime:
    AZDecisionRuntime

  public constructor(
    dependencies:
      AZDecisionRuntimeAssemblyDependencies,
  ) {
    this.contextPreferenceWmeRegistry =
      new AZContextPreferenceWmeRegistry(
        dependencies.causalProvenanceRegistry,
      )

    this.contextSlotWmeRemover =
      new AZContextSlotWmeRemover(
        this.contextPreferenceWmeRegistry,
      )

    this.goalContextInitializer =
      new AZGoalContextInitializer(
        dependencies.goalStateRegistry,
        dependencies.goalIdentityRegistry,
        dependencies.identifierStateRegistry,
        dependencies.structuralRegistry,
        dependencies.preferenceMemory,
        dependencies.predefinedSymbols,
      )

    this.lowerContextCreator =
      new AZLowerContextCreator(
        dependencies.symbolManager,
        dependencies.predefinedSymbols,
        dependencies.workingMemory,
        dependencies.contextStack,
        dependencies.stateStack,
        this.goalContextInitializer,
        dependencies.goalStateRegistry,
        dependencies.structuralRegistry,
        dependencies.impasseRegistry,
      )

    this.existingContextRemover =
      new AZExistingContextRemover(
        dependencies.contextStack,
        dependencies.stateStack,
        dependencies.preferenceMemory,
        this.contextSlotWmeRemover,
        dependencies.goalStateRegistry,
        dependencies.structuralRegistry,
        dependencies.impasseRegistry,
      )

    this.impasseItemBacktraceRegistry =
      new AZImpasseItemBacktraceRegistry(
        dependencies.causalProvenanceRegistry,
      )

    this.impasseItemInstantiationCreator =
      new AZImpasseItemInstantiationCreator(
        dependencies.predefinedSymbols,
        dependencies.goalStateRegistry,
        dependencies.structuralRegistry,
      )

    this.impasseItemsUpdater =
      new AZImpasseItemsUpdater(
        dependencies.predefinedSymbols,
        dependencies.symbolManager,
        this.impasseItemInstantiationCreator,
        this.impasseItemBacktraceRegistry,
        dependencies.structuralRegistry,
      )

    this.nonContextPreferenceSemantics =
      new AZNonContextPreferenceSemantics()

    this.nonContextPreferenceWmeRegistry =
      new AZNonContextPreferenceWmeRegistry(
        dependencies.causalProvenanceRegistry,
      )

    this.nonContextSlotDecider =
      new AZNonContextSlotDecider(
        this.nonContextPreferenceSemantics,
        this.nonContextPreferenceWmeRegistry,
      )

    this.contextPreferenceSemantics =
      new AZDefaultContextPreferenceSemantics(
        dependencies.candidateSelectionPolicy,
      )

    this.contextDecisionConsistencyChecker =
      new AZContextDecisionConsistencyChecker(
        this.contextPreferenceSemantics,
        dependencies.structuralRegistry,
      )

    this.currentContextDecisionRemover =
      new AZCurrentContextDecisionRemover(
        dependencies.structuralRegistry,
        this.contextSlotWmeRemover,
      )

    this.workingMemoryChangesApplier =
      new AZWorkingMemoryChangesApplier(
        dependencies.bufferedLinkChangesProcessor,
      )

    this.consistencyProcessor =
      new AZContextDecisionConsistencyProcessor(
        dependencies.contextStack,
        dependencies.structuralRegistry,
        dependencies.preferenceMemory,
        dependencies.workingMemory,
        dependencies.matchSet,
        this.contextDecisionConsistencyChecker,
        this.currentContextDecisionRemover,
        this.existingContextRemover,
        this.workingMemoryChangesApplier,
      )

    this.contextSlotDecider =
      new AZContextSlotDecider(
        this.contextPreferenceSemantics,
        dependencies.contextStack,
        dependencies.structuralRegistry,
        this.lowerContextCreator,
        this.existingContextRemover,
        this.contextSlotWmeRemover,
        this.contextPreferenceWmeRegistry,
        this.impasseItemsUpdater,
        dependencies.predefinedSymbols.state,
        dependencies.contextDecisionObserver,
        dependencies.goalDepthPolicy !== undefined &&
        dependencies.runControl !== undefined
          ? {
              policy: dependencies.goalDepthPolicy,
              goalStateRegistry: dependencies.goalStateRegistry,
              runControl: dependencies.runControl,
            }
          : undefined,
      )

    this.contextSlotsDecider =
      new AZContextSlotsDecider(
        dependencies.contextStack,
        dependencies.contextChangeTracker,
        dependencies.predefinedSymbols,
        new AZDefaultContextSlotDecidability(),
        this.contextSlotDecider,
      )

    this.nonContextSlotsDecider =
      new AZNonContextSlotsDecider(
        this.nonContextSlotDecider,
      )

    this.decideRuntime =
      new AZDecisionRuntime(
        this.contextSlotsDecider,
        dependencies.preferenceMemory,
        dependencies.workingMemory,
        dependencies.matchSet,
        this.workingMemoryChangesApplier,
      )
  }
}
