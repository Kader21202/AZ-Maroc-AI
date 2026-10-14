import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import { isAZBinaryPreferenceType } from '../operator/AZPreferenceTypeSemantics'
import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZIdentifierReferenceProvider {
  getReferencedIdentifiers(
    identifier: AZSymbol,
  ): readonly AZSymbol[]
}

export class AZDefaultIdentifierReferenceProvider
  implements AZIdentifierReferenceProvider
{
  public constructor(
    private readonly workingMemory:
      AZWorkingMemory,

    private readonly preferenceMemory:
      AZPreferenceMemory,
  ) {}

  public getReferencedIdentifiers(
    identifier: AZSymbol,
  ): readonly AZSymbol[] {
    const referenced =
      new Set<AZSymbol>()

    for (
      const wme of
        this.workingMemory.getElements()
    ) {
      if (
        wme.identifier === identifier &&
        wme.value.type === 'IDENTIFIER'
      ) {
        referenced.add(wme.value)
      }
    }

    for (
      const slot of
        this.preferenceMemory
          .getSlotsForIdentifier(
            identifier,
          )
    ) {
      for (
        const preference of
          slot.allPreferences
      ) {
        if (
          preference.value.type ===
            'IDENTIFIER'
        ) {
          referenced.add(
            preference.value,
          )
        }

        if (
          isAZBinaryPreferenceType(
            preference.type,
          ) &&
          preference.referent !== null &&
          preference.referent.type ===
            'IDENTIFIER'
        ) {
          referenced.add(
            preference.referent,
          )
        }
      }

      if (
        slot.impasseId !== null &&
        slot.impasseId.type ===
          'IDENTIFIER'
      ) {
        referenced.add(
          slot.impasseId,
        )
      }

      for (const wme of slot.wmes) {
        if (
          wme.value.type ===
            'IDENTIFIER'
        ) {
          referenced.add(wme.value)
        }
      }
    }

    return Array.from(referenced)
  }
}

