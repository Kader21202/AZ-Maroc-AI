import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZIdentifierGarbageCollector {
  collect(identifier: AZSymbol): void
}

export class AZDefaultIdentifierGarbageCollector
  implements AZIdentifierGarbageCollector
{
  public constructor(
    private readonly preferenceMemory:
      AZPreferenceMemory,

    private readonly workingMemory:
      AZWorkingMemory,
  ) {}

  public collect(
    identifier: AZSymbol,
  ): void {
    const scheduledRemovals =
      new Set<AZWorkingMemoryElement>()

    for (
      const wme of
        this.workingMemory.getElements()
    ) {
      if (wme.identifier !== identifier) {
        continue
      }

      this.workingMemory.scheduleRemove(
        wme,
      )
      scheduledRemovals.add(wme)
    }

    const slots =
      this.preferenceMemory
        .getSlotsForIdentifier(
          identifier,
        )

    for (const slot of slots) {
      for (
        const wme of [...slot.wmes]
      ) {
        if (!scheduledRemovals.has(wme)) {
          this.workingMemory.scheduleRemove(
            wme,
          )
          scheduledRemovals.add(wme)
        }
      }

      slot.wmes.length = 0

      for (
        const preference of
          [...slot.allPreferences]
      ) {
        this.preferenceMemory.remove(
          preference,
        )
      }

      this.preferenceMemory
        .markSlotForPossibleRemoval(
          slot,
        )
    }
  }
}
