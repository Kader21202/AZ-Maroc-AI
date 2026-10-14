import type { AZProductionAction } from './AZProductionAction'
import type { AZProductionCondition } from './AZProductionCondition'
import type { AZProductionDeclaredSupport } from './AZProductionDeclaredSupport'

export interface AZProductionDescriptor {
  readonly name: string
  readonly declaredSupport: AZProductionDeclaredSupport
  readonly conditions: readonly AZProductionCondition[]
  readonly actions: readonly AZProductionAction[]
}
