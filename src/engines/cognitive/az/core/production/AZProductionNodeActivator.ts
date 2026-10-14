import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZMatchSet } from './AZMatchSet'
import type { AZProductionNode } from './AZProductionNode'
import type { AZToken } from './AZToken'

export interface AZProductionNodeActivator {
  activate(
    node: AZProductionNode,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken
}
