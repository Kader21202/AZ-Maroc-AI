import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalStateResolver } from './AZGoalStateResolver'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZGoalContextStack } from '../state/AZGoalContextStack'

import { AZDefaultAlphaMemoryManager } from './AZDefaultAlphaMemoryManager'
import { AZDefaultConditionNetworkBuilder } from './AZConditionNetworkBuilder'
import { AZDefaultInstantiationRematchMatcher } from './AZDefaultInstantiationRematchMatcher'
import { AZDefaultInstantiatedConditionBuilder } from './AZDefaultInstantiatedConditionBuilder'
import { AZMatchSet } from './AZMatchSet'
import { AZDefaultNegativeConditionBuilder } from './AZNegativeConditionBuilder'
import { AZDefaultPositiveConditionBuilder } from './AZPositiveConditionBuilder'
import { AZDefaultProductionActionCompiler } from './AZProductionActionCompiler'
import { AZDefaultProductionActionListEquality } from './AZProductionActionListEquality'
import { AZDefaultProductionAssertionTypeResolver } from './AZDefaultProductionAssertionTypeResolver'
import { AZDefaultProductionDuplicateDetector } from './AZProductionDuplicateDetector'
import { AZDefaultProductionInstaller } from './AZProductionInstaller'
import { AZProductionDescriptorMaterializer } from './AZProductionDescriptorMaterializer'
import { AZDefaultProductionNodeActivator } from './AZDefaultProductionNodeActivator'
import { AZDefaultProductionRhsIdentifierResolver } from './AZDefaultProductionRhsIdentifierResolver'
import { AZDefaultProductionMatcher } from './AZProductionMatcher'
import { AZProceduralMemory } from './AZProceduralMemory'
import { AZDefaultReteActivationEngine } from './AZDefaultReteActivationEngine'
import { AZDefaultReteHashIndex } from './AZDefaultReteHashIndex'
import { AZDefaultReteHashExtractor } from './AZReteHashExtractor'
import { AZDefaultReteHashReferentResolver } from './AZDefaultReteHashReferentResolver'
import { AZDefaultReteLinkManager } from './AZDefaultReteLinkManager'
import { AZDefaultReteMatchGoalResolver } from './AZDefaultReteMatchGoalResolver'
import { AZDefaultReteMpNodeManager } from './AZDefaultReteMpNodeManager'
import { AZDefaultReteNodeFactory } from './AZDefaultReteNodeFactory'
import { AZDefaultReteNodeRemovalManager } from './AZDefaultReteNodeRemovalManager'
import { AZDefaultReteParentResolver } from './AZDefaultReteParentResolver'
import { AZDefaultReteTestBuilder } from './AZDefaultReteTestBuilder'
import { AZDefaultReteTestMatcher } from './AZDefaultReteTestMatcher'
import { AZDefaultReteTokenIdentityManager } from './AZDefaultReteTokenIdentityManager'
import { AZDefaultReteTokenRemovalManager } from './AZDefaultReteTokenRemovalManager'
import { AZDefaultRhsValueCompiler } from './AZRhsValueCompiler'
import { AZDefaultRhsValueEquality } from './AZRhsValueEquality'
import { AZDefaultVariableBindingManager } from './AZDefaultVariableBindingManager'
import { AZDefaultWorkingMemoryReteMatcher } from './AZDefaultWorkingMemoryReteMatcher'

export class AZProductionRuntimeAssembly {
  public readonly matchSet: AZMatchSet
  public readonly proceduralMemory: AZProceduralMemory
  public readonly productionMatcher: AZDefaultProductionMatcher
  public readonly productionInstaller: AZDefaultProductionInstaller
  public readonly productionMaterializer: AZProductionDescriptorMaterializer
  public readonly workingMemoryReteMatcher: AZDefaultWorkingMemoryReteMatcher

  public constructor(
    workingMemory: AZWorkingMemory,
    goalStateResolver: AZGoalStateResolver,
    operatorSymbol: AZSymbol,
    identifierLinkStateRegistry?: AZIdentifierLinkStateRegistry,
    contextStack?: AZGoalContextStack,
  ) {
    this.productionMaterializer =
      new AZProductionDescriptorMaterializer()
    const hashIndex = new AZDefaultReteHashIndex()
    const matchSet = new AZMatchSet()
    const nodeFactory = new AZDefaultReteNodeFactory()
    const linkManager = new AZDefaultReteLinkManager()
    const tokenIdentityManager =
      new AZDefaultReteTokenIdentityManager()

    const parentResolver =
      new AZDefaultReteParentResolver()

    const instantiatedConditionBuilder =
      new AZDefaultInstantiatedConditionBuilder(
        parentResolver,
      )

    const rematchMatcher =
      new AZDefaultInstantiationRematchMatcher(
        instantiatedConditionBuilder,
      )

    const matchGoalResolver =
      new AZDefaultReteMatchGoalResolver(
        goalStateResolver,
      )

    const rhsIdentifierResolver =
      new AZDefaultProductionRhsIdentifierResolver()

    const assertionTypeResolver =
      new AZDefaultProductionAssertionTypeResolver(
        operatorSymbol,
        goalStateResolver,
        instantiatedConditionBuilder,
        rhsIdentifierResolver,
      )

    const productionNodeActivator =
      new AZDefaultProductionNodeActivator(
        rematchMatcher,
        matchGoalResolver,
        assertionTypeResolver,
      )

    const tokenRemovalManager =
      new AZDefaultReteTokenRemovalManager(
        hashIndex,
        tokenIdentityManager,
        productionNodeActivator,
        linkManager,
        identifierLinkStateRegistry,
      )

    const activationEngine =
      new AZDefaultReteActivationEngine(
        new AZDefaultReteTestMatcher(
          undefined,
          goalStateResolver,
        ),
        productionNodeActivator,
        hashIndex,
        new AZDefaultReteHashReferentResolver(),
        tokenRemovalManager,
        tokenIdentityManager,
        linkManager,
      )

    tokenRemovalManager.setChildLeftActivator(
      activationEngine,
    )

    const mpNodeManager =
      new AZDefaultReteMpNodeManager(
        nodeFactory,
      )

    const nodeRemovalManager =
      new AZDefaultReteNodeRemovalManager(
        linkManager,
        mpNodeManager,
        tokenRemovalManager,
      )

    const alphaMemoryManager =
      new AZDefaultAlphaMemoryManager(
        workingMemory,
        hashIndex,
      )

    const bindings =
      new AZDefaultVariableBindingManager()

    const testBuilder =
      new AZDefaultReteTestBuilder(
        bindings,
      )

    const hashExtractor =
      new AZDefaultReteHashExtractor()

    const positiveBuilder =
      new AZDefaultPositiveConditionBuilder(
        bindings,
        testBuilder,
        hashExtractor,
        alphaMemoryManager,
        nodeFactory,
        mpNodeManager,
        activationEngine,
        matchSet,
      )

    const negativeBuilder =
      new AZDefaultNegativeConditionBuilder(
        bindings,
        testBuilder,
        hashExtractor,
        alphaMemoryManager,
        nodeFactory,
        activationEngine,
        matchSet,
        linkManager,
      )

    const conditionNetworkBuilder =
      new AZDefaultConditionNetworkBuilder(
        positiveBuilder,
        negativeBuilder,
        bindings,
        nodeFactory,
      )

    const actionCompiler =
      new AZDefaultProductionActionCompiler(
        new AZDefaultRhsValueCompiler(
          bindings,
        ),
      )

    const duplicateDetector =
      new AZDefaultProductionDuplicateDetector(
        new AZDefaultProductionActionListEquality(
          new AZDefaultRhsValueEquality(),
        ),
      )

    const workingMemoryReteMatcher =
      new AZDefaultWorkingMemoryReteMatcher(
        alphaMemoryManager,
        activationEngine,
        matchSet,
      )

    workingMemory.setPropagation({
      onAdded(element): void {
        workingMemoryReteMatcher
          .addWorkingMemoryElement(element)
      },

      onRemoved(element): void {
        workingMemoryReteMatcher
          .removeWorkingMemoryElement(element)
      },
    })

    const proceduralMemory =
      new AZProceduralMemory()

    const productionMatcher =
      new AZDefaultProductionMatcher(
        matchSet,
        tokenRemovalManager,
        nodeRemovalManager,
        conditionNetworkBuilder,
        actionCompiler,
        duplicateDetector,
        nodeFactory,
        activationEngine,
        bindings,
      )

    this.matchSet = matchSet
    this.proceduralMemory = proceduralMemory
    this.productionMatcher = productionMatcher
    this.productionInstaller =
      new AZDefaultProductionInstaller(
        proceduralMemory,
        productionMatcher,
      )
    this.workingMemoryReteMatcher =
      workingMemoryReteMatcher
  }
}
