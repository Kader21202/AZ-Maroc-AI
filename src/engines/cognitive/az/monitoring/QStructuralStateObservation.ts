import type { AZImpasseType } from '../core/decision/AZImpasseType'
import type { AZPreferenceType } from '../core/operator/AZPreferenceType'
import type { AZMatchAssertionType } from '../core/production/AZMatchSet'
import type { AZProductionTestType } from '../core/production/AZProductionTestType'
import type {
  StructuralStateElementObservation,
  StructuralStateSymbolObservation,
} from './StructuralStateObservation'

export interface QPreferenceObservation {
  readonly type: AZPreferenceType
  readonly identifier: StructuralStateSymbolObservation
  readonly attribute: StructuralStateSymbolObservation
  readonly value: StructuralStateSymbolObservation
  readonly referent: StructuralStateSymbolObservation | null
  readonly level: number
  readonly numericValue: number
  readonly oSupported: boolean
  readonly inTemporaryMemory: boolean
  readonly instantiationMatchGoalLevel:
    number | null
}

export interface QPreferenceSlotReferenceObservation {
  readonly identifier: StructuralStateSymbolObservation
  readonly attribute: StructuralStateSymbolObservation
}

export interface QPreferenceTypeGroupObservation {
  readonly type: AZPreferenceType
  readonly preferences:
    readonly QPreferenceObservation[]
}

export interface QPreferenceSlotObservation {
  readonly identifier: StructuralStateSymbolObservation
  readonly attribute: StructuralStateSymbolObservation
  readonly isaContextSlot: boolean
  readonly impasseType: AZImpasseType
  readonly impasseId: StructuralStateSymbolObservation | null
  readonly acceptablePreferenceChanged: boolean
  readonly changed: boolean
  readonly markedForPossibleRemoval: boolean
  readonly preferences: readonly QPreferenceObservation[]
  readonly preferencesByType:
    readonly QPreferenceTypeGroupObservation[]
  readonly wmes: readonly StructuralStateElementObservation[]
  readonly acceptablePreferenceWmes:
    readonly StructuralStateElementObservation[]
}

export interface QProductionTestObservation {
  readonly type: AZProductionTestType
  readonly referent?: StructuralStateSymbolObservation
  readonly disjunction?:
    readonly StructuralStateSymbolObservation[]
  readonly conjuncts?:
    readonly QProductionTestObservation[]
}

export type QInstantiatedConditionObservation =
  | {
      readonly type: 'POSITIVE'
      readonly identifierTest: QProductionTestObservation
      readonly attributeTest: QProductionTestObservation
      readonly valueTest: QProductionTestObservation
      readonly acceptable: boolean
      readonly workingMemoryElement:
        StructuralStateElementObservation | null
    }
  | {
      readonly type: 'NEGATIVE'
      readonly identifierTest: QProductionTestObservation
      readonly attributeTest: QProductionTestObservation
      readonly valueTest: QProductionTestObservation
      readonly acceptable: boolean
    }
  | {
      readonly type: 'CONJUNCTIVE_NEGATION'
      readonly conditions:
        readonly QInstantiatedConditionObservation[]
    }

export interface QMatchAssertionObservation {
  readonly type: AZMatchAssertionType
  readonly productionName: string
  readonly matchGoal:
    StructuralStateSymbolObservation | null
  readonly matchGoalLevel: number
  readonly conditions:
    readonly QInstantiatedConditionObservation[]
  readonly terminalWme:
    StructuralStateElementObservation | null
}

export interface QMatchRetractionObservation {
  readonly productionName: string | null
  readonly matchGoal:
    StructuralStateSymbolObservation | null
  readonly matchGoalLevel: number
  readonly conditions:
    readonly QInstantiatedConditionObservation[]
  readonly generatedPreferences:
    readonly QPreferenceObservation[]
  readonly inMatchSet: boolean
}

export interface QMatchSetObservation {
  readonly assertions:
    readonly QMatchAssertionObservation[]
  readonly retractions:
    readonly QMatchRetractionObservation[]
  readonly nilGoalRetractions:
    readonly QMatchRetractionObservation[]
}

export interface QStructuralStateObservation {
  readonly workingMemory:
    readonly StructuralStateElementObservation[]
  readonly preferenceSlots:
    readonly QPreferenceSlotObservation[]
  readonly changedSlots:
    readonly QPreferenceSlotReferenceObservation[]
  readonly acceptablePreferenceChangedSlots:
    readonly QPreferenceSlotReferenceObservation[]
  readonly slotsForPossibleRemoval:
    readonly QPreferenceSlotReferenceObservation[]
  readonly matchSet: QMatchSetObservation
}
