import type { AZProductionAction } from './AZProductionAction'
import type { AZProductionCondition } from './AZProductionCondition'
import type { AZProductionDeclaredSupport } from './AZProductionDeclaredSupport'
import type { AZInstantiation } from './AZInstantiation'
import type { AZProductionNode } from './AZProductionNode'

export interface AZProduction {
  readonly name: string
  readonly declaredSupport: AZProductionDeclaredSupport
  readonly conditions: readonly AZProductionCondition[]
  actions: readonly AZProductionAction[]

  instantiations: AZInstantiation[]

  productionNode?: AZProductionNode | null
}
