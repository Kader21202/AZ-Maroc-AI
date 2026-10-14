import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZInstantiation } from './AZInstantiation'

export interface AZNewPreferenceAssertionResult {
  readonly assertedInstantiations:
    readonly AZInstantiation[]
  readonly rejectedPreferencesProcessed:
    number
}

export class AZNewPreferenceAsserter {
  public constructor(
    private readonly preferenceMemory:
      AZPreferenceMemory,
  ) {}

  public assert(
    instantiations:
      readonly AZInstantiation[],
  ): AZNewPreferenceAssertionResult {
    let rejectedPreferencesProcessed = 0

    /*
     * First process every o-supported
     * REJECT preference.
     */
    for (const instantiation of instantiations) {
      for (
        const preference of
        instantiation.generatedPreferences
      ) {
        if (
          preference.type === 'REJECT' &&
          preference.oSupported
        ) {
          this.preferenceMemory
            .processOSupportedReject(
              preference,
            )

          rejectedPreferencesProcessed += 1
        }
      }
    }

    const assertedInstantiations:
      AZInstantiation[] = []

    /*
     * Register still-matching
     * instantiations in their runtime
     * production, then assert ordinary
     * preferences.
     */
    for (const instantiation of instantiations) {
      if (instantiation.inMatchSet) {
        const production =
          instantiation.production

        if (production === null) {
          throw new Error(
            'Architectural instantiation cannot be in the match set',
          )
        }

        if (
          !production.instantiations.includes(
            instantiation,
          )
        ) {
          production.instantiations.push(
            instantiation,
          )
        }

        assertedInstantiations.push(
          instantiation,
        )
      }

      for (
        const preference of
        instantiation.generatedPreferences
      ) {
        if (
          preference.type === 'REJECT' &&
          preference.oSupported
        ) {
          continue
        }

        if (
          instantiation.inMatchSet ||
          preference.oSupported
        ) {
          this.preferenceMemory.add(
            preference,
          )
        }
      }
    }

    return {
      assertedInstantiations,
      rejectedPreferencesProcessed,
    }
  }
}
