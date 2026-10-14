import type { AZProduction } from './AZProduction'
import type { AZProductionActionListEquality } from './AZProductionActionListEquality'
import type { AZProductionNode } from './AZProductionNode'
import type { AZReteNode } from './AZReteNode'
import type { AZReteNodeBase } from './AZReteNodeBase'

export interface AZProductionDuplicateDetector {
  findDuplicate(
    bottomNode: AZReteNode,
    production: AZProduction,
  ): AZProduction | null
}

export class AZDefaultProductionDuplicateDetector
  implements AZProductionDuplicateDetector
{
  public constructor(
    private readonly actionListEquality:
      AZProductionActionListEquality,
  ) {}

  public findDuplicate(
    bottomNode: AZReteNode,
    production: AZProduction,
  ): AZProduction | null {
    for (
      const child of
      bottomNode.children
    ) {
      if (
        !this.isProductionNode(child)
      ) {
        continue
      }

      if (
        !this.actionListEquality.equals(
          child.production.actions,
          production.actions,
        )
      ) {
        continue
      }

      return child.production
    }

    return null
  }

  private isProductionNode(
    node: AZReteNodeBase,
  ): node is AZProductionNode {
    return node.type === 'PRODUCTION'
  }
}
