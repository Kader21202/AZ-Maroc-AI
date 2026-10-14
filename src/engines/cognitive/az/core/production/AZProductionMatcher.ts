import type { AZConditionNetworkBuilder } from './AZConditionNetworkBuilder'
import type { AZMatchSet } from './AZMatchSet'
import type { AZProduction } from './AZProduction'
import type { AZProductionActionCompiler } from './AZProductionActionCompiler'
import type { AZProductionAdditionResult } from './AZProductionAdditionResult'
import type { AZProductionDuplicateDetector } from './AZProductionDuplicateDetector'
import type { AZReteActivationEngine } from './AZReteActivationEngine'
import type { AZDummyTopNode } from './AZDummyTopNode'
import type { AZReteNodeFactory } from './AZReteNodeFactory'
import type { AZReteNode } from './AZReteNode'
import type { AZReteNodeRemovalManager } from './AZReteNodeRemovalManager'
import type { AZReteTokenRemovalManager } from './AZReteTokenRemovalManager'
import type { AZRhsCompilationContext } from './AZRhsValueCompiler'
import type { AZVariableBindingManager } from './AZVariableBindingManager'

export interface AZProductionMatcher {
  addProduction(
    production: AZProduction,
  ): AZProductionAdditionResult

  exciseProduction(
    production: AZProduction,
  ): void

  getMatchSet(): AZMatchSet
}

export class AZDefaultProductionMatcher
  implements AZProductionMatcher
{
  private root:
    AZDummyTopNode | null = null

  public constructor(
    private readonly matchSet:
      AZMatchSet,

    private readonly tokenRemovalManager:
      AZReteTokenRemovalManager,

    private readonly nodeRemovalManager:
      AZReteNodeRemovalManager,

    private readonly conditionNetworkBuilder:
      AZConditionNetworkBuilder,

    private readonly actionCompiler:
      AZProductionActionCompiler,

    private readonly duplicateDetector:
      AZProductionDuplicateDetector,

    private readonly nodeFactory:
      AZReteNodeFactory,

    private readonly reteActivationEngine:
      AZReteActivationEngine,

    private readonly variableBindingManager:
      AZVariableBindingManager,
  ) {}

  public addProduction(
    production: AZProduction,
  ): AZProductionAdditionResult {
    if (this.root === null) {
      this.root =
        this.nodeFactory
          .createDummyTopNode()
    }

    if (
      production.productionNode !==
        undefined &&
      production.productionNode !== null
    ) {
      throw new Error(
        `Production ${production.name} is already installed in the RETE`,
      )
    }

    const network =
      this.conditionNetworkBuilder.build(
        production.conditions,
        1,
        this.root,
        true,
      )

    try {
      const rhsContext:
        AZRhsCompilationContext = {
          unboundVariableIndexes:
            new Map<string, number>(),
          nextUnboundVariableIndex: 0,
        }

      production.actions =
        production.actions.map(
          action =>
            this.actionCompiler.compile(
              action,
              network.bottomDepth,
              rhsContext,
            ),
        )
    } finally {
      this.variableBindingManager
        .popBindings(
          network.boundVariables,
        )
    }

    const duplicate =
      this.duplicateDetector
        .findDuplicate(
          network.bottomNode,
          production,
        )

    if (duplicate !== null) {
      return 'DUPLICATE_PRODUCTION'
    }

    const productionNode =
      this.nodeFactory
        .createProductionNode(
          network.bottomNode,
          production,
        )

    this.reteActivationEngine
      .updateNodeWithMatchesFromAbove(
        productionNode,
        this.matchSet,
      )

    return 'NO_REFRACTED_INSTANTIATION'
  }

  public getMatchSet(): AZMatchSet {
    return this.matchSet
  }

  public exciseProduction(
    production: AZProduction,
  ): void {
    const productionNode =
      production.productionNode

    if (
      productionNode === undefined ||
      productionNode === null
    ) {
      throw new Error(
        `Production ${production.name} is not installed in the RETE`,
      )
    }

    const parent = productionNode.parent as AZReteNode | null

    if (parent === null) {
      throw new Error(
        'Production node must have a parent before excision',
      )
    }

    production.productionNode = null

    while (
      productionNode.tokens.length > 0
    ) {
      const token =
        productionNode.tokens[0]

      if (token === undefined) {
        break
      }

      this.tokenRemovalManager
        .removeTokenAndSubtree(
          token,
          this.matchSet,
        )
    }

    const index =
      parent.children.indexOf(
        productionNode,
      )

    if (index < 0) {
      throw new Error(
        'Production node must be registered as a child of its parent',
      )
    }

    parent.children.splice(
      index,
      1,
    )

    productionNode.parent = null

    if (
      parent.children.length === 0 &&
      parent.type !== 'DUMMY_TOP'
    ) {
      this.nodeRemovalManager
        .removeNode(
          parent,
          this.matchSet,
        )
    }
  }
}


