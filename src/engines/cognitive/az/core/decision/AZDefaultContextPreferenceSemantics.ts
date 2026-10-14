import type { AZCandidateSelectionPolicy } from './AZCandidateSelectionPolicy'
import type { AZContextPreferenceSemantics } from './AZContextPreferenceSemantics'
import type { AZContextPreferenceSemanticsResult } from './AZContextPreferenceSemanticsResult'
import { AZDefaultCandidateSelectionPolicy } from './AZDefaultCandidateSelectionPolicy'
import type { AZPreference } from '../operator/AZPreference'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZSymbol } from '../symbols/AZSymbol'

export class AZDefaultContextPreferenceSemantics
  implements AZContextPreferenceSemantics
{
  public constructor(
    private readonly selectionPolicy:
      AZCandidateSelectionPolicy =
        new AZDefaultCandidateSelectionPolicy(),
  ) {}

  public evaluate(
    slot: AZPreferenceSlot,
  ): AZContextPreferenceSemanticsResult {
    const required =
      slot.preferencesByType.get(
        'REQUIRE',
      ) ?? []

    if (required.length !== 0) {
      return this.evaluateRequired(
        slot,
        required,
      )
    }

    const acceptable =
      slot.preferencesByType.get(
        'ACCEPTABLE',
      ) ?? []

    const prohibited =
      slot.preferencesByType.get(
        'PROHIBIT',
      ) ?? []

    const rejected =
      slot.preferencesByType.get(
        'REJECT',
      ) ?? []

    const blockedValues =
      new Set<AZSymbol>()

    for (const preference of prohibited) {
      blockedValues.add(
        preference.value,
      )
    }

    for (const preference of rejected) {
      blockedValues.add(
        preference.value,
      )
    }

    const seenValues =
      new Set<AZSymbol>()

    let candidates:
      AZPreference[] = []

    for (const preference of acceptable) {
      if (
        blockedValues.has(
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

      candidates.push(
        preference,
      )
    }

    if (candidates.length > 1) {
      const candidateValues =
        new Set(
          candidates.map(
            candidate =>
              candidate.value,
          ),
        )

      const conflictedValues =
        new Set<AZSymbol>()

      const better =
        slot.preferencesByType.get(
          'BETTER',
        ) ?? []

      for (const preference of better) {
        const referent =
          preference.referent

        if (
          referent !== null &&
          preference.value !== referent &&
          candidateValues.has(
            preference.value,
          ) &&
          candidateValues.has(
            referent,
          )
        ) {
          conflictedValues.add(
            referent,
          )
        }
      }

      const worse =
        slot.preferencesByType.get(
          'WORSE',
        ) ?? []

      for (const preference of worse) {
        const referent =
          preference.referent

        if (
          referent !== null &&
          preference.value !== referent &&
          candidateValues.has(
            preference.value,
          ) &&
          candidateValues.has(
            referent,
          )
        ) {
          conflictedValues.add(
            preference.value,
          )
        }
      }

      if (conflictedValues.size > 0) {
        const survivors =
          candidates.filter(
            candidate =>
              !conflictedValues.has(
                candidate.value,
              ),
          )

        if (survivors.length === 0) {
          return {
            impasseType: 'CONFLICT',
            candidates:
              candidates.filter(
                candidate =>
                  conflictedValues.has(
                    candidate.value,
                  ),
              ),
          }
        }

        candidates = survivors

        if (candidates.length <= 1) {
          return {
            impasseType: 'NONE',
            candidates,
          }
        }
      }
    }

    const best =
      slot.preferencesByType.get(
        'BEST',
      ) ?? []

    if (best.length > 0) {
      const bestValues =
        new Set(
          best.map(
            preference =>
              preference.value,
          ),
        )

      const bestCandidates =
        candidates.filter(
          candidate =>
            bestValues.has(
              candidate.value,
            ),
        )

      if (bestCandidates.length > 0) {
        candidates = bestCandidates

        if (candidates.length <= 1) {
          return {
            impasseType: 'NONE',
            candidates,
          }
        }
      }
    }

    const worst =
      slot.preferencesByType.get(
        'WORST',
      ) ?? []

    if (worst.length > 0) {
      const worstValues =
        new Set(
          worst.map(
            preference =>
              preference.value,
          ),
        )

      const nonWorstCandidates =
        candidates.filter(
          candidate =>
            !worstValues.has(
              candidate.value,
            ),
        )

      if (
        nonWorstCandidates.length > 0
      ) {
        candidates =
          nonWorstCandidates

        if (candidates.length <= 1) {
          return {
            impasseType: 'NONE',
            candidates,
          }
        }
      }
    }

    if (candidates.length > 1) {
      const unaryIndifferent =
        slot.preferencesByType.get(
          'UNARY_INDIFFERENT',
        ) ?? []

      const unaryValues =
        new Set(
          unaryIndifferent.map(
            preference =>
              preference.value,
          ),
        )

      const numericIndifferent =
        slot.preferencesByType.get(
          'NUMERIC_INDIFFERENT',
        ) ?? []

      const numericValues =
        new Set(
          numericIndifferent.map(
            preference =>
              preference.value,
          ),
        )

      const binaryIndifferent =
        slot.preferencesByType.get(
          'BINARY_INDIFFERENT',
        ) ?? []

      const allIndifferent =
        candidates.every(
          candidate => {
            if (
              unaryValues.has(
                candidate.value,
              ) ||
              numericValues.has(
                candidate.value,
              )
            ) {
              return true
            }

            return candidates.every(
              other => {
                if (other === candidate) {
                  return true
                }

                return binaryIndifferent.some(
                  preference =>
                    (
                      preference.value ===
                        candidate.value &&
                      preference.referent ===
                        other.value
                    ) ||
                    (
                      preference.value ===
                        other.value &&
                      preference.referent ===
                        candidate.value
                    ),
                )
              },
            )
          },
        )

      if (allIndifferent) {
        const selected =
          this.selectionPolicy.select(
            slot,
            candidates,
          )

        return {
          impasseType: 'NONE',
          candidates: [selected],
        }
      }

      return {
        impasseType: 'TIE',
        candidates,
      }
    }

    return {
      impasseType: 'NONE',
      candidates,
    }
  }

  private evaluateRequired(
    slot: AZPreferenceSlot,
    required:
      readonly AZPreference[],
  ): AZContextPreferenceSemanticsResult {
    const seenValues =
      new Set<AZSymbol>()

    const candidates:
      AZPreference[] = []

    for (const preference of required) {
      if (
        seenValues.has(
          preference.value,
        )
      ) {
        continue
      }

      seenValues.add(
        preference.value,
      )

      candidates.push(
        preference,
      )
    }

    if (candidates.length > 1) {
      return {
        impasseType:
          'CONSTRAINT_FAILURE',
        candidates,
      }
    }

    const winner =
      candidates[0]

    if (winner === undefined) {
      return {
        impasseType: 'NONE',
        candidates: [],
      }
    }

    const prohibited =
      slot.preferencesByType.get(
        'PROHIBIT',
      ) ?? []

    if (
      prohibited.some(
        preference =>
          preference.value ===
            winner.value,
      )
    ) {
      return {
        impasseType:
          'CONSTRAINT_FAILURE',
        candidates,
      }
    }

    return {
      impasseType: 'NONE',
      candidates,
    }
  }
}
