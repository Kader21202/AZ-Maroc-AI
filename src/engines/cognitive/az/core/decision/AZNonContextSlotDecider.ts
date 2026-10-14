import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZPreference } from '../operator/AZPreference'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZNonContextPreferenceSemantics } from './AZNonContextPreferenceSemantics'
import type { AZNonContextPreferenceWmeRegistry } from './AZNonContextPreferenceWmeRegistry'

export class AZNonContextSlotDecider {
  public constructor(
    private readonly semantics:
      AZNonContextPreferenceSemantics,

    private readonly registry:
      AZNonContextPreferenceWmeRegistry,
  ) {}

  public decide(
    slot: AZPreferenceSlot,
    preferenceMemory: AZPreferenceMemory,
    workingMemory: AZWorkingMemory,
  ): void {
    const candidates =
      this.semantics.evaluate(
        slot,
        preferenceMemory,
      )

    const desired =
      new Map<AZSymbol, AZPreference>()

    for (const candidate of candidates) {
      if (!desired.has(candidate.value)) {
        desired.set(
          candidate.value,
          candidate,
        )
      }
    }

    for (
      let index = slot.wmes.length - 1;
      index >= 0;
      index -= 1
    ) {
      const wme =
        slot.wmes[index]

      if (wme === undefined) {
        continue
      }

      const candidate =
        desired.get(
          wme.value,
        )

      if (candidate !== undefined) {
        this.registry.set(
          wme,
          candidate,
        )

        desired.delete(
          wme.value,
        )

        continue
      }

      slot.wmes.splice(
        index,
        1,
      )

      this.registry.remove(wme)

      workingMemory.scheduleRemove(
        wme,
      )
    }

    for (
      const candidate of
        desired.values()
    ) {
      const wme =
        workingMemory.createElement(
          candidate.identifier,
          candidate.attribute,
          candidate.value,
          false,
        )

      slot.wmes.unshift(
        wme,
      )

      this.registry.set(
        wme,
        candidate,
      )

      workingMemory.scheduleAdd(
        wme,
      )
    }
  }
}

export class AZNonContextSlotsDecider {
  public constructor(
    private readonly slotDecider:
      AZNonContextSlotDecider,
  ) {}

  public decideAll(
    preferenceMemory: AZPreferenceMemory,
    workingMemory: AZWorkingMemory,
  ): void {
    for (;;) {
      const slot =
        preferenceMemory
          .takeNextChangedSlot()

      if (slot === null) {
        return
      }

      this.slotDecider.decide(
        slot,
        preferenceMemory,
        workingMemory,
      )

      slot.changed = false
    }
  }
}
