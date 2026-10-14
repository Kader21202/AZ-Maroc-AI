import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZPreference } from '../operator/AZPreference'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZAcceptablePreferenceWmeRegistry } from './AZAcceptablePreferenceWmeRegistry'

export class AZAcceptablePreferenceWmeSynchronizer {
  public constructor(
    private readonly registry:
      AZAcceptablePreferenceWmeRegistry,
  ) {}

  public synchronize(
    slot: AZPreferenceSlot,
    workingMemory: AZWorkingMemory,
  ): void {
    if (!slot.isaContextSlot) {
      throw new Error(
        'Acceptable preference WME synchronization requires a context slot',
      )
    }

    const required =
      slot.preferencesByType.get(
        'REQUIRE',
      ) ?? []

    const acceptable =
      slot.preferencesByType.get(
        'ACCEPTABLE',
      ) ?? []

    const desired =
      this.collectDesiredPreferences(
        required,
        acceptable,
      )

    for (
      let index =
        slot.acceptablePreferenceWmes.length - 1;
      index >= 0;
      index -= 1
    ) {
      const wme =
        slot.acceptablePreferenceWmes[index]

      if (wme === undefined) {
        continue
      }

      const preference =
        desired.get(wme.value)

      if (preference !== undefined) {
        this.registry.set(
          wme,
          preference,
        )

        desired.delete(
          wme.value,
        )

        continue
      }

      slot.acceptablePreferenceWmes.splice(
        index,
        1,
      )

      this.registry.remove(wme)

      workingMemory.scheduleRemove(
        wme,
      )
    }

    for (
      const [value, preference]
      of desired
    ) {
      const wme =
        workingMemory.createElement(
          slot.identifier,
          slot.attribute,
          value,
          true,
        )

      slot.acceptablePreferenceWmes.unshift(
        wme,
      )

      this.registry.set(
        wme,
        preference,
      )

      workingMemory.scheduleAdd(
        wme,
      )
    }
  }

  private collectDesiredPreferences(
    required: readonly AZPreference[],
    acceptable: readonly AZPreference[],
  ): Map<AZSymbol, AZPreference> {
    const result =
      new Map<AZSymbol, AZPreference>()

    for (const preference of required) {
      if (!result.has(preference.value)) {
        result.set(
          preference.value,
          preference,
        )
      }
    }

    for (const preference of acceptable) {
      if (!result.has(preference.value)) {
        result.set(
          preference.value,
          preference,
        )
      }
    }

    return result
  }
}

export class AZAcceptablePreferenceWmeChangesProcessor {
  public processAll(
    preferenceMemory:
      AZPreferenceMemory,
    workingMemory:
      AZWorkingMemory,
    synchronizer:
      AZAcceptablePreferenceWmeSynchronizer,
  ): void {
    for (;;) {
      const slot =
        preferenceMemory
          .takeNextAcceptablePreferenceChangedSlot()

      if (slot === null) {
        return
      }

      synchronizer.synchronize(
        slot,
        workingMemory,
      )

      slot.acceptablePreferenceChanged =
        false
    }
  }
}
