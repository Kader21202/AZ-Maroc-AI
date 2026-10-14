import type { AZReteHashIndex } from './AZReteHashIndex'
import type { AZRightMemory } from './AZRightMemory'
import type { AZToken } from './AZToken'

export class AZDefaultReteHashIndex
  implements AZReteHashIndex
{
  public static readonly LOG2_TABLE_SIZE = 14

  public static readonly TABLE_SIZE =
    1 << AZDefaultReteHashIndex.LOG2_TABLE_SIZE

  public static readonly MASK =
    AZDefaultReteHashIndex.TABLE_SIZE - 1

  public readonly tableSize =
    AZDefaultReteHashIndex.TABLE_SIZE

  public readonly mask =
    AZDefaultReteHashIndex.MASK

  private readonly leftTable: AZToken[][] =
    Array.from(
      {
        length:
          AZDefaultReteHashIndex.TABLE_SIZE,
      },
      () => [],
    )

  private readonly rightTable:
    AZRightMemory[][] =
    Array.from(
      {
        length:
          AZDefaultReteHashIndex.TABLE_SIZE,
      },
      () => [],
    )

  public insertLeft(
    token: AZToken,
    hashValue: number,
  ): void {
    const bucket =
      this.leftTable[
        this.getBucketIndex(hashValue)
      ]

    if (!bucket) {
      throw new Error(
        'Invalid AZ RETE left hash bucket',
      )
    }

    if (!bucket.includes(token)) {
      bucket.unshift(token)
    }
  }

  public removeLeft(
    token: AZToken,
    hashValue: number,
  ): boolean {
    const bucket =
      this.leftTable[
        this.getBucketIndex(hashValue)
      ]

    if (!bucket) {
      return false
    }

    const index = bucket.indexOf(token)

    if (index < 0) {
      return false
    }

    bucket.splice(index, 1)

    return true
  }

  public getLeftBucket(
    hashValue: number,
  ): readonly AZToken[] {
    return (
      this.leftTable[
        this.getBucketIndex(hashValue)
      ] ?? []
    )
  }

  public insertRight(
    rightMemory: AZRightMemory,
    hashValue: number,
  ): void {
    const bucket =
      this.rightTable[
        this.getBucketIndex(hashValue)
      ]

    if (!bucket) {
      throw new Error(
        'Invalid AZ RETE right hash bucket',
      )
    }

    if (!bucket.includes(rightMemory)) {
      bucket.unshift(rightMemory)
    }
  }

  public removeRight(
    rightMemory: AZRightMemory,
    hashValue: number,
  ): boolean {
    const bucket =
      this.rightTable[
        this.getBucketIndex(hashValue)
      ]

    if (!bucket) {
      return false
    }

    const index =
      bucket.indexOf(rightMemory)

    if (index < 0) {
      return false
    }

    bucket.splice(index, 1)

    return true
  }

  public getRightBucket(
    hashValue: number,
  ): readonly AZRightMemory[] {
    return (
      this.rightTable[
        this.getBucketIndex(hashValue)
      ] ?? []
    )
  }

  private getBucketIndex(
    hashValue: number,
  ): number {
    return hashValue & this.mask
  }
}
