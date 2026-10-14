import type { AZInstantiation } from '../production/AZInstantiation'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZPreferenceSlot } from './AZPreferenceSlot'
import type { AZPreferenceType } from './AZPreferenceType'

export interface AZPreference {
  readonly type: AZPreferenceType
  readonly identifier: AZSymbol
  readonly attribute: AZSymbol
  readonly value: AZSymbol
  readonly referent: AZSymbol | null
  readonly level: number
  readonly numericValue: number

  oSupported: boolean

  inTemporaryMemory: boolean
  slot: AZPreferenceSlot | null

  readonly instantiation: AZInstantiation | null
}
