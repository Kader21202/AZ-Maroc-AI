import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZContextPreferenceWmeRegistry } from './AZContextPreferenceWmeRegistry'

export class AZContextSlotWmeRemover {
  public constructor(
    private readonly preferenceWmeRegistry:
      AZContextPreferenceWmeRegistry,
  ) {}

  public remove(
    slot: AZPreferenceSlot,
    workingMemory: AZWorkingMemory,
  ): void {
    if (!slot.isaContextSlot) {
      throw new Error(
        'Context slot WME removal requires a context slot',
      )
    }

    const wme =
      slot.wmes[0]

    if (wme === undefined) {
      return
    }

    slot.wmes.length = 0

    this.preferenceWmeRegistry.remove(
      wme,
    )

    workingMemory.scheduleRemove(
      wme,
    )
  }
}
