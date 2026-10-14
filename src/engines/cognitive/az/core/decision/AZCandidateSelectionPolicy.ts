import type { AZPreference } from '../operator/AZPreference'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'

export interface AZCandidateSelectionPolicy {
  select(
    slot: AZPreferenceSlot,
    candidates: readonly AZPreference[],
  ): AZPreference
}
