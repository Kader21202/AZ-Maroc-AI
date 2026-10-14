import type { QStructuralStateObservation } from './QStructuralStateObservation'
import { DefaultQStructuralStateCanonicalizer } from './DefaultQStructuralStateCanonicalizer'

export interface QWitness {
  readonly structuralState:
    QStructuralStateObservation
  readonly stochasticIndex: number
}

export class DefaultQWitnessEquivalence {
  private readonly structuralCanonicalizer =
    new DefaultQStructuralStateCanonicalizer()

  public equivalent(
    left: QWitness,
    right: QWitness,
  ): boolean {
    if (
      left.stochasticIndex !==
      right.stochasticIndex
    ) {
      return false
    }

    return (
      this.structuralCanonicalizer
        .canonicalize(left.structuralState) ===
      this.structuralCanonicalizer
        .canonicalize(right.structuralState)
    )
  }
}
