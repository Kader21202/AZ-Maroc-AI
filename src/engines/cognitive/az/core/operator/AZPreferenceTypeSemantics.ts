import type { AZPreferenceType } from './AZPreferenceType'

export function isAZBinaryPreferenceType(
  type: AZPreferenceType,
): boolean {
  switch (type) {
    case 'BINARY_INDIFFERENT':
    case 'BINARY_PARALLEL':
    case 'BETTER':
    case 'WORSE':
    case 'NUMERIC_INDIFFERENT':
      return true

    default:
      return false
  }
}
