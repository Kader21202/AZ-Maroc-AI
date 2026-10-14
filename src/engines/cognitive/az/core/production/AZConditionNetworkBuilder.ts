import type { AZNegativeConditionBuilder } from './AZNegativeConditionBuilder'
import type { AZPositiveConditionBuilder } from './AZPositiveConditionBuilder'
import type { AZProductionCondition } from './AZProductionCondition'
import type { AZReteNode } from './AZReteNode'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZReteNodeFactory } from './AZReteNodeFactory'
import type { AZCnNode } from './AZCnNode'
import type { AZVariableBindingManager } from './AZVariableBindingManager'
import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZConditionNetworkBuildResult {
  readonly bottomNode: AZReteNode
  readonly bottomDepth: number
  readonly boundVariables: readonly AZSymbol[]
}

export interface AZConditionNetworkBuilder {
  build(
    conditions: readonly AZProductionCondition[],
    depthOfFirstCondition: number,
    parent: AZReteNode,
    retainBindings: boolean,
  ): AZConditionNetworkBuildResult
}

export class AZDefaultConditionNetworkBuilder
  implements AZConditionNetworkBuilder
{
  public constructor(
    private readonly positiveConditionBuilder:
      AZPositiveConditionBuilder,
    private readonly negativeConditionBuilder:
      AZNegativeConditionBuilder,
    private readonly variableBindingManager:
      AZVariableBindingManager,
    private readonly nodeFactory:
      AZReteNodeFactory,
  ) {}

  public build(
    conditions: readonly AZProductionCondition[],
    depthOfFirstCondition: number,
    parent: AZReteNode,
    retainBindings: boolean,
  ): AZConditionNetworkBuildResult {
    let node = parent
    let currentDepth = depthOfFirstCondition
    const boundVariables: AZSymbol[] = []
    let completed = false

    try {
      for (const condition of conditions) {
        switch (condition.type) {
          case 'POSITIVE':
            node =
              this.positiveConditionBuilder.build(
                condition,
                currentDepth,
                node,
              )

            boundVariables.push(
              ...this.bindPositiveConditionDensely(
                condition,
                currentDepth,
              ),
            )
            break

          case 'NEGATIVE':
            node =
              this.negativeConditionBuilder.build(
                condition,
                currentDepth,
                node,
              )
            break

          case 'CONJUNCTIVE_NEGATION': {
            const subconditions =
              this.build(
                condition.conditions,
                currentDepth,
                node,
                false,
              )

            const existing =
              this.findMatchingCnNode(
                node,
                subconditions.bottomNode,
              )

            if (existing !== null) {
              node = existing
            } else {
              node =
                this.nodeFactory.createCnNodes(
                  node,
                  subconditions.bottomNode,
                ).node
            }

            break
          }
        }

        currentDepth += 1
      }

      const result:
        AZConditionNetworkBuildResult = {
          bottomNode: node,
          bottomDepth:
            currentDepth - 1,
          boundVariables:
            retainBindings
              ? [...boundVariables]
              : [],
        }

      completed = true
      return result
    } finally {
      if (
        !retainBindings ||
        !completed
      ) {
        this.variableBindingManager
          .popBindings(
            boundVariables,
          )
      }
    }
  }

  private bindPositiveConditionDensely(
    condition: Extract<
      AZProductionCondition,
      { readonly type: 'POSITIVE' }
    >,
    currentDepth: number,
  ): readonly AZSymbol[] {
    const variables: AZSymbol[] = []

    variables.push(
      ...this.variableBindingManager
        .bindVariablesInTest(
          condition.identifierTest,
          currentDepth,
          0,
          true,
        ),
    )

    variables.push(
      ...this.variableBindingManager
        .bindVariablesInTest(
          condition.attributeTest,
          currentDepth,
          1,
          true,
        ),
    )

    variables.push(
      ...this.variableBindingManager
        .bindVariablesInTest(
          condition.valueTest,
          currentDepth,
          2,
          true,
        ),
    )

    return variables
  }

  private findMatchingCnNode(
    parent: AZReteNode,
    bottomOfSubconditions: AZReteNode,
  ): AZCnNode | null {
    for (const child of parent.children) {
      if (!this.isCnNode(child)) {
        continue
      }

      if (
        child.partner !== null &&
        child.partner.parent ===
          bottomOfSubconditions
      ) {
        return child
      }
    }

    return null
  }

  private isCnNode(
    node: AZReteNodeBase,
  ): node is AZCnNode {
    return node.type === 'CN'
  }
}
