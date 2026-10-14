import type { AZContextPreferenceSemanticsResult } from './AZContextPreferenceSemanticsResult'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'

export interface AZContextPreferenceSemantics {
  evaluate(
    slot: AZPreferenceSlot,
  ): AZContextPreferenceSemanticsResult
}
