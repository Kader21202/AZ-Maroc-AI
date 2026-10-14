import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZInstantiatedCondition } from './AZInstantiatedCondition'
import type { AZProduction } from './AZProduction'
import type { AZProductionNode } from './AZProductionNode'
import type { AZToken } from './AZToken'

export interface AZInstantiatedConditionBuilder {
  build(
    production: AZProduction,
    productionNode: AZProductionNode,
    token: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): readonly AZInstantiatedCondition[]
}
