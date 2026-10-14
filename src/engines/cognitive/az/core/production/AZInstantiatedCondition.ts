import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZProductionCondition } from './AZProductionCondition'

export type AZInstantiatedCondition =
  | {
      readonly type: 'POSITIVE'
      readonly sourceCondition: Extract<
        AZProductionCondition,
        { readonly type: 'POSITIVE' }
      >
      readonly workingMemoryElement: AZWorkingMemoryElement | null
    }
  | {
      readonly type: 'NEGATIVE'
      readonly sourceCondition: Extract<
        AZProductionCondition,
        { readonly type: 'NEGATIVE' }
      >
    }
  | {
      readonly type: 'CONJUNCTIVE_NEGATION'
      readonly sourceCondition: Extract<
        AZProductionCondition,
        { readonly type: 'CONJUNCTIVE_NEGATION' }
      >
      readonly conditions: readonly AZInstantiatedCondition[]
    }
