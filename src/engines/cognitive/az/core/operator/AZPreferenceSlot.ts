import type { AZImpasseType } from '../decision/AZImpasseType'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZPreference } from './AZPreference'
import type { AZPreferenceType } from './AZPreferenceType'

export interface AZPreferenceSlot {
  readonly identifier: AZSymbol
  readonly attribute: AZSymbol

  readonly allPreferences: AZPreference[]

  readonly preferencesByType:
    Map<AZPreferenceType, AZPreference[]>

  readonly wmes: AZWorkingMemoryElement[]

  isaContextSlot: boolean

  impasseType: AZImpasseType
  impasseId: AZSymbol | null

  acceptablePreferenceChanged: boolean

  readonly acceptablePreferenceWmes:
    AZWorkingMemoryElement[]

  changed: boolean
  markedForPossibleRemoval: boolean
}
