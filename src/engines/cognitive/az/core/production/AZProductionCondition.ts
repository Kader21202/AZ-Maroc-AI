import type { AZProductionTest } from './AZProductionTest'

export type AZProductionCondition =
  | {
      readonly type: 'POSITIVE'
      readonly identifierTest: AZProductionTest
      readonly attributeTest: AZProductionTest
      readonly valueTest: AZProductionTest
      readonly acceptable: boolean
    }
  | {
      readonly type: 'NEGATIVE'
      readonly identifierTest: AZProductionTest
      readonly attributeTest: AZProductionTest
      readonly valueTest: AZProductionTest
      readonly acceptable: boolean
    }
  | {
      readonly type: 'CONJUNCTIVE_NEGATION'
      readonly conditions: readonly AZProductionCondition[]
    }
