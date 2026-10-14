import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZInstantiation } from './AZInstantiation'

export class AZInstantiationRetractor {
  public constructor(
    private readonly preferenceMemory:
      AZPreferenceMemory,
  ) {}

  public retract(
    instantiation: AZInstantiation,
  ): void {
    /*
     * Remove only preferences currently
     * present in temporary memory and
     * which are not o-supported.
     */
    for (
      const preference of
      instantiation.generatedPreferences
    ) {
      if (
        preference.inTemporaryMemory &&
        !preference.oSupported
      ) {
        this.preferenceMemory.remove(
          preference,
        )
      }
    }

    /*
     * Keep the RETE runtime production
     * state consistent with token-removal
     * processing.
     */
    const production =
      instantiation.production

    if (production !== null) {
      const index =
        production.instantiations.indexOf(
          instantiation,
        )

      if (index >= 0) {
        production.instantiations.splice(
          index,
          1,
        )
      }
    }

    instantiation.inMatchSet = false
  }
}
