import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'

export interface AZContextSlotDecidability {
  isDecidable(
    slot: AZPreferenceSlot,
  ): boolean
}
