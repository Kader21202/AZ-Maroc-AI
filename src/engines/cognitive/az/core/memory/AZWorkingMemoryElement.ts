import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZWorkingMemoryElement {
  readonly timetag: number
  readonly identifier: AZSymbol
  readonly attribute: AZSymbol
  readonly value: AZSymbol
  readonly acceptable: boolean
}
