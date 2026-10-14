import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZToken } from './AZToken'

export interface AZNegativeMatch {
  readonly leftToken: AZToken
  readonly workingMemoryElement: AZWorkingMemoryElement
  readonly node: AZReteNodeBase & {
    readonly type: 'NEGATIVE' | 'UNHASHED_NEGATIVE'
  }
}
