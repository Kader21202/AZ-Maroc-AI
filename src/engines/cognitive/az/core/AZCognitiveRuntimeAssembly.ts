import { AZElaborationRuntimeAssembly } from './cycle/AZElaborationRuntimeAssembly'
import { AZWmeCausalProvenanceRegistry } from './AZWmeCausalProvenanceRegistry'
import { AZDefaultCognitiveRunControl } from './cycle/AZDefaultCognitiveRunControl'
import { AZPhaseRuntimeAssembly } from './cycle/AZPhaseRuntimeAssembly'
import { AZBufferedLinkChangesProcessor } from './decision/AZBufferedLinkChangesProcessor'
import { AZDefaultIdentifierDemotionProcessor } from './decision/AZIdentifierDemotionProcessor'
import { AZDefaultIdentifierDemotionQueueProcessor } from './decision/AZIdentifierDemotionQueueProcessor'
import { AZDefaultIdentifierGarbageCollector } from './decision/AZIdentifierGarbageCollector'
import { AZDefaultIdentifierLevelWalker } from './decision/AZIdentifierLevelWalker'
import { AZDefaultIdentifierPromotionBufferProcessor } from './decision/AZIdentifierPromotionBufferProcessor'
import { AZDefaultIdentifierPromotionProcessor } from './decision/AZIdentifierPromotionProcessor'
import { AZDefaultIdentifierReferenceProvider } from './decision/AZIdentifierReferenceProvider'
import { AZDefaultIdentifierUnknownLevelMarker } from './decision/AZIdentifierUnknownLevelMarker'
import { AZDefaultLinkAdditionProcessor } from './decision/AZLinkAdditionProcessor'
import { AZDefaultLinkRemovalProcessor } from './decision/AZLinkRemovalProcessor'
import { AZDefaultTransitiveClosureNumberGenerator } from './decision/AZTransitiveClosureNumberGenerator'
import { AZDecisionRuntimeAssembly } from './decision/AZDecisionRuntimeAssembly'
import type { AZContextDecisionObserver } from './decision/AZContextDecisionObserver'
import type { AZCandidateSelectionPolicy } from './decision/AZCandidateSelectionPolicy'
import { AZDefaultWmePreferenceResolver } from './decision/AZDefaultWmePreferenceResolver'
import { AZIoState } from './io/AZIoState'
import { AZOutputLinkManager } from './io/AZOutputLinkManager'
import { AZPreferenceMemory } from './memory/AZPreferenceMemory'
import { AZWorkingMemory } from './memory/AZWorkingMemory'
import { AZProductionRuntimeAssembly } from './production/AZProductionRuntimeAssembly'
import { AZHaltRhsFunction } from './production/AZHaltRhsFunction'
import { AZAddRhsFunction } from './production/AZAddRhsFunction'
import { AZRhsFunctionRegistry } from './production/AZRhsFunctionRegistry'
import { AZDefaultGoalStateRegistry } from './state/AZDefaultGoalStateRegistry'
import { AZDefaultGoalIdentityRegistry } from './state/AZDefaultGoalIdentityRegistry'
import { AZDefaultIdentifierLinkStateRegistry } from './state/AZDefaultIdentifierLinkStateRegistry'
import { AZDefaultImpasseStateRegistry } from './state/AZDefaultImpasseStateRegistry'
import {
  AZDefaultGoalStructuralStateRegistry,
} from './state/AZGoalStructuralStateRegistry'
import { AZGoalContextStack } from './state/AZGoalContextStack'
import { AZBoundedGoalDepthPolicy } from './state/AZGoalDepthPolicy'
import { AZStateStack } from './state/AZStateStack'
import { AZPredefinedSymbols } from './symbols/AZPredefinedSymbols'
import { AZSymbolManager } from './symbols/AZSymbolManager'
import { AZContextChangeTracker } from './state/AZContextChangeTracker'

/**
 * Global composition root for the generic AZ cognitive runtime.
 *
 * This class owns wiring only. Cognitive state is instantiated once
 * and shared by production, elaboration, decision and phase execution.
 */
export class AZCognitiveRuntimeAssembly {
  public readonly symbolManager:
    AZSymbolManager

  public readonly predefinedSymbols:
    AZPredefinedSymbols

  public readonly goalStateRegistry:
    AZDefaultGoalStateRegistry


  public readonly goalIdentityRegistry:
    AZDefaultGoalIdentityRegistry
  public readonly contextChangeTracker:
    AZContextChangeTracker

  public readonly structuralRegistry:
    AZDefaultGoalStructuralStateRegistry

  public readonly identifierStateRegistry:
    AZDefaultIdentifierLinkStateRegistry

  public readonly impasseRegistry:
    AZDefaultImpasseStateRegistry

  public readonly contextStack:
    AZGoalContextStack

  public readonly stateStack:
    AZStateStack

  public readonly ioState:
    AZIoState

  public readonly outputLinkManager:
    AZOutputLinkManager

  public readonly linkAdditionProcessor:
    AZDefaultLinkAdditionProcessor

  public readonly linkRemovalProcessor:
    AZDefaultLinkRemovalProcessor

  public readonly preferenceMemory:
    AZPreferenceMemory

  public readonly workingMemory:
    AZWorkingMemory

  public readonly bufferedLinkChangesProcessor:
    AZBufferedLinkChangesProcessor

  public readonly runControl:
    AZDefaultCognitiveRunControl

  public readonly rhsFunctionRegistry:
    AZRhsFunctionRegistry

  public readonly causalProvenanceRegistry:
    AZWmeCausalProvenanceRegistry

  public readonly productionRuntime:
    AZProductionRuntimeAssembly

  public readonly decisionRuntime:
    AZDecisionRuntimeAssembly

  public readonly elaborationRuntime:
    AZElaborationRuntimeAssembly

  public readonly wmePreferenceResolver:
    AZDefaultWmePreferenceResolver

  public readonly phaseRuntime:
    AZPhaseRuntimeAssembly

  public constructor(
    onNormalInputCycle?: () => void,
      contextDecisionObserver?: AZContextDecisionObserver,
    candidateSelectionPolicy?: AZCandidateSelectionPolicy,
  ) {
    this.symbolManager =
      new AZSymbolManager()

    this.predefinedSymbols =
      new AZPredefinedSymbols(
        this.symbolManager,
      )

    this.goalStateRegistry =
      new AZDefaultGoalStateRegistry()


    this.goalIdentityRegistry =
      new AZDefaultGoalIdentityRegistry()
    this.contextChangeTracker =
      new AZContextChangeTracker(
        this.goalStateRegistry,
      )

    this.structuralRegistry =
      new AZDefaultGoalStructuralStateRegistry()

    this.identifierStateRegistry =
      new AZDefaultIdentifierLinkStateRegistry()

    this.impasseRegistry =
      new AZDefaultImpasseStateRegistry()

    this.contextStack =
      new AZGoalContextStack()

    this.stateStack =
      new AZStateStack()

    this.ioState =
      new AZIoState()

    this.outputLinkManager =
      new AZOutputLinkManager(
        this.ioState,
      )

    this.linkAdditionProcessor =
      new AZDefaultLinkAdditionProcessor(
        this.identifierStateRegistry,
        this.goalStateRegistry,
        this.impasseRegistry,
      )

    this.linkRemovalProcessor =
      new AZDefaultLinkRemovalProcessor(
        this.identifierStateRegistry,
        this.goalStateRegistry,
        this.impasseRegistry,
      )

    this.workingMemory =
      new AZWorkingMemory(
        this.linkAdditionProcessor,
        this.linkRemovalProcessor,
        this.outputLinkManager,
      )

    this.preferenceMemory =
      new AZPreferenceMemory(
        this.linkAdditionProcessor,
        this.linkRemovalProcessor,
        this.contextChangeTracker,
      )

    const referenceProvider =
      new AZDefaultIdentifierReferenceProvider(
        this.workingMemory,
        this.preferenceMemory,
      )

    const promotionProcessor =
      new AZDefaultIdentifierPromotionProcessor(
        this.identifierStateRegistry,
        this.goalStateRegistry,
        this.impasseRegistry,
        referenceProvider,
      )

    const promotionBufferProcessor =
      new AZDefaultIdentifierPromotionBufferProcessor(
        this.linkAdditionProcessor,
        promotionProcessor,
        this.identifierStateRegistry,
      )

    const demotionQueueProcessor =
      new AZDefaultIdentifierDemotionQueueProcessor(
        this.linkRemovalProcessor,
        this.identifierStateRegistry,
      )

    const garbageCollector =
      new AZDefaultIdentifierGarbageCollector(
        this.preferenceMemory,
        this.workingMemory,
      )

    const unknownLevelMarker =
      new AZDefaultIdentifierUnknownLevelMarker(
        referenceProvider,
        this.identifierStateRegistry,
        this.linkRemovalProcessor,
      )

    const levelWalker =
      new AZDefaultIdentifierLevelWalker(
        this.workingMemory,
        this.preferenceMemory,
        this.identifierStateRegistry,
        this.linkRemovalProcessor,
      )

    const tcGenerator =
      new AZDefaultTransitiveClosureNumberGenerator()

    const demotionProcessor =
      new AZDefaultIdentifierDemotionProcessor(
        demotionQueueProcessor,
        garbageCollector,
        unknownLevelMarker,
        levelWalker,
        this.linkRemovalProcessor,
        tcGenerator,
        this.stateStack,
        this.goalStateRegistry,
        this.identifierStateRegistry,
      )

    this.bufferedLinkChangesProcessor =
      new AZBufferedLinkChangesProcessor(
        this.linkAdditionProcessor,
        this.linkRemovalProcessor,
        promotionBufferProcessor,
        demotionProcessor,
      )

    this.runControl =
      new AZDefaultCognitiveRunControl()

    this.rhsFunctionRegistry =
      new AZRhsFunctionRegistry()

    this.rhsFunctionRegistry.register(
      this.symbolManager.makeStringConstant('+'),
      new AZAddRhsFunction(this.symbolManager),
    )

    this.rhsFunctionRegistry.register(
      this.symbolManager.makeStringConstant('halt'),
      new AZHaltRhsFunction(
        this.runControl,
      ),
    )

    this.productionRuntime =
      new AZProductionRuntimeAssembly(
        this.workingMemory,
        this.goalIdentityRegistry,
        this.predefinedSymbols.operator,
        this.identifierStateRegistry,
        this.contextStack,
      )
    this.causalProvenanceRegistry =
      new AZWmeCausalProvenanceRegistry()



    this.decisionRuntime =
      new AZDecisionRuntimeAssembly({
        symbolManager:
          this.symbolManager,
        predefinedSymbols:
          this.predefinedSymbols,
        preferenceMemory:
          this.preferenceMemory,
        workingMemory:
          this.workingMemory,
        matchSet:
          this.productionRuntime.matchSet,
        contextStack:
          this.contextStack,
        stateStack:
          this.stateStack,
        contextChangeTracker:
          this.contextChangeTracker,
        goalStateRegistry:
          this.goalStateRegistry,
        goalIdentityRegistry:
          this.goalIdentityRegistry,
        identifierStateRegistry:
          this.identifierStateRegistry,
        structuralRegistry:
          this.structuralRegistry,
        impasseRegistry:
          this.impasseRegistry,
        bufferedLinkChangesProcessor:
          this.bufferedLinkChangesProcessor,
        causalProvenanceRegistry:
          this.causalProvenanceRegistry,
        contextDecisionObserver,
        candidateSelectionPolicy,
        goalDepthPolicy:
          new AZBoundedGoalDepthPolicy(100),
        runControl:
          this.runControl,
      })

    this.elaborationRuntime =
      new AZElaborationRuntimeAssembly({
        symbolManager:
          this.symbolManager,
        identifierStateRegistry:
          this.identifierStateRegistry,
        structuralRegistry:
          this.structuralRegistry,
        preferenceMemory:
          this.preferenceMemory,
        workingMemory:
          this.workingMemory,
        nonContextSlotsDecider:
          this.decisionRuntime
            .nonContextSlotsDecider,
        bufferedLinkChangesProcessor:
          this.bufferedLinkChangesProcessor,
        rhsFunctionRegistry:
          this.rhsFunctionRegistry,
        causalProvenanceRegistry:
          this.causalProvenanceRegistry,
        goalIdentityRegistry:
          this.goalIdentityRegistry,
        productionInstaller:
          this.productionRuntime.productionInstaller,

                    })

    this.wmePreferenceResolver =
      new AZDefaultWmePreferenceResolver(
        this.decisionRuntime
          .contextPreferenceWmeRegistry,
        this.decisionRuntime
          .nonContextPreferenceWmeRegistry,
        this.elaborationRuntime
          .acceptablePreferenceWmeRegistry,
        this.decisionRuntime
          .impasseItemBacktraceRegistry,
      )

    this.phaseRuntime =
      new AZPhaseRuntimeAssembly({
        elaborationRuntime:
          this.elaborationRuntime,
        matchSet:
          this.productionRuntime.matchSet,
        stateStack:
          this.stateStack,
        identifierStateRegistry:
          this.identifierStateRegistry,
        workingMemory:
          this.workingMemory,
        decisionRuntime:
          this.decisionRuntime,
        runControl:
          this.runControl,
        ioState:
          this.ioState,
        outputLinkManager:
          this.outputLinkManager,
        onNormalInputCycle,
      })
  }
}

