import type { AZContextSlotDecidability } from './AZContextSlotDecidability'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'

export class AZDefaultContextSlotDecidability
  implements AZContextSlotDecidability
{
  public isDecidable(
    slot: AZPreferenceSlot,
  ): boolean {
    if (slot.wmes.length !== 0) {
      return false
    }

    return slot.changed
  }
}
