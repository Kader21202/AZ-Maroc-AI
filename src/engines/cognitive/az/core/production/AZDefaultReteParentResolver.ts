import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZReteParentResolver } from './AZReteParentResolver'

export class AZDefaultReteParentResolver
  implements AZReteParentResolver
{
  public getRealParent(
    node: AZReteNodeBase,
  ): AZReteNodeBase | null {
    const parent = node.parent

    if (parent === null) {
      return null
    }

    if (
      (
        node.type === 'POSITIVE' ||
        node.type === 'UNHASHED_POSITIVE'
      ) &&
      (
        parent.type === 'MEMORY' ||
        parent.type === 'UNHASHED_MEMORY'
      )
    ) {
      return parent.parent
    }

    return parent
  }
}
