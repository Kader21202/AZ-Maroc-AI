import type { AZSymbol } from '../symbols/AZSymbol'
import type {
  AZReteFieldNumber,
  AZVariableLocation,
} from './AZVariableLocation'
import type {
  AZReteRelationalType,
  AZReteTestKind,
} from './AZReteTestType'

export type AZReteTestData =
  | {
      readonly kind: 'VARIABLE'
      readonly location: AZVariableLocation
    }
  | {
      readonly kind: 'CONSTANT'
      readonly symbol: AZSymbol
    }
  | {
      readonly kind: 'DISJUNCTION'
      readonly symbols: readonly AZSymbol[]
    }
  | {
      readonly kind: 'NONE'
    }

export interface AZReteTest {
  readonly rightFieldNumber: AZReteFieldNumber
  readonly type: AZReteTestKind
  readonly relationalType?: AZReteRelationalType
  readonly data: AZReteTestData
  readonly next: AZReteTest | null
}
