import type {
  AZProductionPreferenceType,
  AZProductionSupportType,
} from './AZProductionPreferenceType'
import type { AZProductionRhsValue } from './AZProductionRhsValue'

export type AZProductionAction =
  | {
      readonly type: 'MAKE'
      readonly preferenceType: AZProductionPreferenceType
      readonly identifier: AZProductionRhsValue
      readonly attribute: AZProductionRhsValue
      readonly value: AZProductionRhsValue
      readonly referent?: AZProductionRhsValue
      readonly support: AZProductionSupportType
    }
  | {
      readonly type: 'FUNCALL'
      readonly functionCall: AZProductionRhsValue
    }
