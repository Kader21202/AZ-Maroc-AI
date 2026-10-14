import type { AZSymbol } from '../symbols/AZSymbol'

export type AZProductionRhsValue =
  | {
      readonly type: 'SYMBOL'
      readonly symbol: AZSymbol
    }
  | {
      readonly type: 'FUNCALL'
      readonly functionName: AZSymbol
      readonly arguments: readonly AZProductionRhsValue[]
    }
  | {
      readonly type: 'RETE_LOCATION'
      readonly fieldNumber: number
      readonly levelsUp: number
    }
  | {
      readonly type: 'UNBOUND_VARIABLE'
      readonly index: number
    }
