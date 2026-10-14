import type { AZImpasseType } from './AZImpasseType'
import type { AZPreference } from '../operator/AZPreference'

export interface AZContextPreferenceSemanticsResult {
  readonly impasseType: AZImpasseType
  readonly candidates:
    readonly AZPreference[]
}
