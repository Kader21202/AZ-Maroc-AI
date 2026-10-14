import type { StructuralStateObservation } from './StructuralStateObservation'

export interface StructuralStateCanonicalizer {
  canonicalize(
    observation: StructuralStateObservation,
  ): string
}
