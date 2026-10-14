import type { AZSymbolType } from './AZSymbolType'

export type AZSymbolValue = string | number | null

export interface AZSymbol {
  readonly id: string
  readonly hashId: number
  readonly type: AZSymbolType
  readonly value: AZSymbolValue
}
