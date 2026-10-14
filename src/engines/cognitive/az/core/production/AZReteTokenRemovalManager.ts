import type { AZMatchSet } from './AZMatchSet'
import type { AZToken } from './AZToken'

export interface AZReteTokenRemovalManager {
  removeTokenAndSubtree(
    root: AZToken,
    matchSet: AZMatchSet,
  ): void
}
