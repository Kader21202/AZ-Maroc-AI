import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZMatchAssertionType } from './AZMatchSet'
import type { AZProductionNode } from './AZProductionNode'
import type { AZToken } from './AZToken'

export interface AZProductionAssertionTypeResolver {
  resolve(
    productionNode: AZProductionNode,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): AZMatchAssertionType
}
