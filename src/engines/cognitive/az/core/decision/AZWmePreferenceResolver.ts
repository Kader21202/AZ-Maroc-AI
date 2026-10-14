import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreference } from '../operator/AZPreference'

export interface AZWmePreferenceResolver {
  resolve(
    wme: AZWorkingMemoryElement,
  ): AZPreference | null
}
