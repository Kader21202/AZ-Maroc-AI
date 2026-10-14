import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZOutputLinkStatus } from './AZOutputLinkStatus'

export interface AZOutputLink {
  status: AZOutputLinkStatus
  readonly linkWme: AZWorkingMemoryElement
  readonly idsInTc: AZSymbol[]
}
