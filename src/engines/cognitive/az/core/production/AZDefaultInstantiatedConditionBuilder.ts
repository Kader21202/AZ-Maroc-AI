import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZCnNode } from './AZCnNode'
import type { AZInstantiatedCondition } from './AZInstantiatedCondition'
import type { AZInstantiatedConditionBuilder } from './AZInstantiatedConditionBuilder'
import type { AZProduction } from './AZProduction'
import type { AZProductionCondition } from './AZProductionCondition'
import type { AZProductionNode } from './AZProductionNode'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZReteParentResolver } from './AZReteParentResolver'
import type { AZToken } from './AZToken'

export class AZDefaultInstantiatedConditionBuilder
  implements AZInstantiatedConditionBuilder
{
  public constructor(
    private readonly reteParentResolver: AZReteParentResolver,
  ) {}

  public build(
    production: AZProduction,
    productionNode: AZProductionNode,
    token: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): readonly AZInstantiatedCondition[] {
    if (productionNode.production !== production) {
      throw new Error(
        'Production node does not belong to the supplied production',
      )
    }

    if (production.conditions.length === 0) {
      return []
    }

    const bottomNode = productionNode.parent

    if (bottomNode === null) {
      throw new Error(
        'Production with conditions requires a RETE parent',
      )
    }

    return this.buildFromBottom(
      production.conditions,
      bottomNode,
      null,
      token,
      workingMemoryElement,
    )
  }

  private buildFromBottom(
    conditions: readonly AZProductionCondition[],
    bottomNode: AZReteNodeBase,
    cutoff: AZReteNodeBase | null,
    token: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): readonly AZInstantiatedCondition[] {
    const instantiated:
      AZInstantiatedCondition[] =
        new Array(conditions.length)

    let currentNode: AZReteNodeBase | null =
      bottomNode

    let currentToken = token
    let currentWme = workingMemoryElement

    for (
      let index = conditions.length - 1;
      index >= 0;
      index -= 1
    ) {
      const condition = conditions[index]

      if (!condition) {
        throw new Error(
          'Missing production condition during RETE reconstruction',
        )
      }

      if (
        currentNode === null ||
        currentNode === cutoff
      ) {
        throw new Error(
          'RETE path ended before all conditions were reconstructed',
        )
      }

      instantiated[index] =
        this.instantiateCondition(
          condition,
          currentNode,
          currentWme,
        )

      const nextNode =
        this.reteParentResolver.getRealParent(
          currentNode,
        )

      currentWme =
        currentToken?.workingMemoryElement ??
        null

      currentToken =
        currentToken?.parent ?? null

      currentNode = nextNode
    }

    return instantiated
  }

  private instantiateCondition(
    condition: AZProductionCondition,
    node: AZReteNodeBase,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
  ): AZInstantiatedCondition {
    switch (condition.type) {
      case 'POSITIVE':
        if (!this.isPositiveNode(node)) {
          throw new Error(
            `Expected positive RETE node, got ${node.type}`,
          )
        }

        return {
          type: 'POSITIVE',
          sourceCondition: condition,
          workingMemoryElement,
        }

      case 'NEGATIVE':
        if (
          node.type !== 'NEGATIVE' &&
          node.type !== 'UNHASHED_NEGATIVE'
        ) {
          throw new Error(
            `Expected negative RETE node, got ${node.type}`,
          )
        }

        return {
          type: 'NEGATIVE',
          sourceCondition: condition,
        }

      case 'CONJUNCTIVE_NEGATION':
        if (node.type !== 'CN') {
          throw new Error(
            `Expected CN RETE node, got ${node.type}`,
          )
        }

        return {
          type: 'CONJUNCTIVE_NEGATION',
          sourceCondition: condition,
          conditions:
            this.buildCnSubconditions(
              condition,
              node as AZCnNode,
            ),
        }
    }
  }

  private buildCnSubconditions(
    condition: Extract<
      AZProductionCondition,
      {
        readonly type:
          'CONJUNCTIVE_NEGATION'
      }
    >,
    node: AZCnNode,
  ): readonly AZInstantiatedCondition[] {
    const partner = node.partner

    if (
      partner === null ||
      partner.type !== 'CN_PARTNER'
    ) {
      throw new Error(
        'CN node requires a CN_PARTNER',
      )
    }

    if (condition.conditions.length === 0) {
      return []
    }

    const bottomOfSubconditions =
      partner.parent

    if (bottomOfSubconditions === null) {
      throw new Error(
        'CN partner requires a subcondition parent',
      )
    }

    return this.buildFromBottom(
      condition.conditions,
      bottomOfSubconditions,
      node.parent,
      null,
      null,
    )
  }

  private isPositiveNode(
    node: AZReteNodeBase,
  ): boolean {
    return (
      node.type === 'POSITIVE' ||
      node.type === 'UNHASHED_POSITIVE' ||
      node.type === 'MP' ||
      node.type === 'UNHASHED_MP'
    )
  }
}
