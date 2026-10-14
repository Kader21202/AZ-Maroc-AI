import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZPreference } from '../operator/AZPreference'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZSymbol } from '../symbols/AZSymbol'

export class AZNonContextPreferenceSemantics {
  public evaluate(
    slot: AZPreferenceSlot,
    preferenceMemory: AZPreferenceMemory,
  ): readonly AZPreference[] {
    if (slot.allPreferences.length === 0) {
      preferenceMemory.markSlotForPossibleRemoval(
        slot,
      )

      return []
    }

    const acceptable =
      slot.preferencesByType.get(
        'ACCEPTABLE',
      ) ?? []

    const rejects =
      slot.preferencesByType.get(
        'REJECT',
      ) ?? []

    const rejectedValues =
      new Set<AZSymbol>(
        rejects.map(
          preference =>
            preference.value,
        ),
      )

    const seenValues =
      new Set<AZSymbol>()

    const candidates: AZPreference[] = []

    for (const preference of acceptable) {
      if (
        rejectedValues.has(
          preference.value,
        ) ||
        seenValues.has(
          preference.value,
        )
      ) {
        continue
      }

      seenValues.add(
        preference.value,
      )

      candidates.unshift(
        preference,
      )
    }

    return candidates
  }
}
