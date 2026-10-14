import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZInstantiation } from './AZInstantiation'
import type { AZProductionNode } from './AZProductionNode'
import type { AZToken } from './AZToken'

export interface AZInstantiationRematchMatcher {
  matches(
    instantiation: AZInstantiation,
    productionNode: AZProductionNode,
    token: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): boolean
}
