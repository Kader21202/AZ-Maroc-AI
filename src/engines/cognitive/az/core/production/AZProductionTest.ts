import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZProductionTestType } from './AZProductionTestType'

export interface AZProductionTest {
  readonly type: AZProductionTestType
  readonly referent?: AZSymbol
  readonly disjunction?: readonly AZSymbol[]
  readonly conjuncts?: readonly AZProductionTest[]
}
