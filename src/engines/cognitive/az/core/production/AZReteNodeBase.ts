import type { AZReteNodeType } from './AZReteNodeType'

export interface AZReteNodeBase {
  readonly type: AZReteNodeType
  readonly nodeId: number | null
  parent: AZReteNodeBase | null
  children: AZReteNodeBase[]
}
