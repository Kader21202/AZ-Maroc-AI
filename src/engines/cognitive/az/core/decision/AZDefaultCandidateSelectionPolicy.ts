import type { AZCandidateSelectionPolicy } from './AZCandidateSelectionPolicy'
import type { AZPreference } from '../operator/AZPreference'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZSymbol } from '../symbols/AZSymbol'

export class AZDefaultCandidateSelectionPolicy
  implements AZCandidateSelectionPolicy
{
  public constructor(
    private readonly random:
      () => number = Math.random,
  ) {}

  public select(
    slot: AZPreferenceSlot,
    candidates: readonly AZPreference[],
  ): AZPreference {
    if (candidates.length === 0) {
      throw new Error(
        'Candidate selection requires at least one candidate',
      )
    }

    if (candidates.length === 1) {
      return candidates[0]!
    }

    const numeric =
      slot.preferencesByType.get(
        'NUMERIC_INDIFFERENT',
      ) ?? []

    /*
     * AZ keeps selection weights local.
     * AZPreference remains immutable with
     * respect to numericValue.
     */
    const values =
      new Map<AZSymbol, number>()

    for (const candidate of candidates) {
      values.set(candidate.value, 0)
    }

    for (const preference of numeric) {
      if (!values.has(preference.value)) {
        continue
      }

      const referent =
        preference.referent

      if (
        referent === null ||
        (
          referent.type !==
            'INTEGER_CONSTANT' &&
          referent.type !==
            'FLOAT_CONSTANT'
        ) ||
        typeof referent.value !==
          'number'
      ) {
        throw new Error(
          'NUMERIC_INDIFFERENT requires a numeric referent',
        )
      }

      values.set(
        preference.value,
        (
          values.get(
            preference.value,
          ) ?? 0
        ) + referent.value,
      )
    }

    const positiveTotal =
      candidates.reduce(
        (total, candidate) =>
          total +
          Math.max(
            0,
            values.get(
              candidate.value,
            ) ?? 0,
          ),
        0,
      )

    if (positiveTotal <= 0) {
      return this.selectUniformly(
        candidates,
      )
    }

    let target =
      this.random() *
      positiveTotal

    for (const candidate of candidates) {
      const weight =
        Math.max(
          0,
          values.get(
            candidate.value,
          ) ?? 0,
        )

      if (weight === 0) {
        continue
      }

      target -= weight

      if (target <= 0) {
        return candidate
      }
    }

    return candidates[
      candidates.length - 1
    ]!
  }

  private selectUniformly(
    candidates: readonly AZPreference[],
  ): AZPreference {
    const index =
      Math.floor(
        this.random() *
        candidates.length,
      )

    return candidates[
      Math.min(
        index,
        candidates.length - 1,
      )
    ]!
  }
}
