import type { AZMatchSet } from './AZMatchSet'
import type { AZReteNode } from './AZReteNode'

export interface AZReteNodeRemovalManager {
  removeNode(
    node: AZReteNode,
    matchSet: AZMatchSet,
  ): void
}
