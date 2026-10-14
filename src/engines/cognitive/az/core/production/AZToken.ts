import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZNegativeMatch } from './AZNegativeMatch'
import type { AZReteNode } from './AZReteNode'

export interface AZToken {
  readonly parent: AZToken | null
  readonly workingMemoryElement: AZWorkingMemoryElement | null
  node: AZReteNode | null
  hashReferent: AZSymbol | null
  negativeMatches: AZNegativeMatch[]
  children: AZToken[]
}
