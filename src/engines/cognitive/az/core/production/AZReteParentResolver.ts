import type { AZReteNodeBase } from './AZReteNodeBase'

export interface AZReteParentResolver {
  getRealParent(
    node: AZReteNodeBase,
  ): AZReteNodeBase | null
}
