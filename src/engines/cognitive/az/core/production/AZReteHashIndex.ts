import type { AZRightMemory } from './AZRightMemory'
import type { AZToken } from './AZToken'

export interface AZReteHashIndex {
  readonly tableSize: number
  readonly mask: number

  insertLeft(
    token: AZToken,
    hashValue: number,
  ): void

  removeLeft(
    token: AZToken,
    hashValue: number,
  ): boolean

  getLeftBucket(
    hashValue: number,
  ): readonly AZToken[]

  insertRight(
    rightMemory: AZRightMemory,
    hashValue: number,
  ): void

  removeRight(
    rightMemory: AZRightMemory,
    hashValue: number,
  ): boolean

  getRightBucket(
    hashValue: number,
  ): readonly AZRightMemory[]
}
