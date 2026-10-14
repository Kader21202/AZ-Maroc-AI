import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZMatchSet } from './AZMatchSet'
import type { AZReteNode } from './AZReteNode'
import type { AZToken } from './AZToken'

export interface AZReteChildLeftActivator {
  activateChildLeft(
    child: AZReteNode,
    parentToken: AZToken | null,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): void
}