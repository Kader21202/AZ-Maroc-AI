import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import { AZAlphaMemory } from './AZAlphaMemory'
import type { AZAlphaMemoryManager } from './AZAlphaMemoryManager'
import type { AZReteHashIndex } from './AZReteHashIndex'

export class AZDefaultAlphaMemoryManager
  implements AZAlphaMemoryManager
{
  private readonly alphaMemories:
    AZAlphaMemory[] = []

  private nextAlphaMemoryId = 0

  public constructor(
    private readonly workingMemory:
      AZWorkingMemory,
    private readonly reteHashIndex:
      AZReteHashIndex,
  ) {}

  public find(
    identifier: AZSymbol | null,
    attribute: AZSymbol | null,
    value: AZSymbol | null,
    acceptable: boolean,
  ): AZAlphaMemory | null {
    return (
      this.alphaMemories.find(
        (alphaMemory) =>
          alphaMemory.identifier === identifier &&
          alphaMemory.attribute === attribute &&
          alphaMemory.value === value &&
          alphaMemory.acceptable === acceptable,
      ) ?? null
    )
  }

  public findOrCreate(
    identifier: AZSymbol | null,
    attribute: AZSymbol | null,
    value: AZSymbol | null,
    acceptable: boolean,
  ): AZAlphaMemory {
    const existing = this.find(
      identifier,
      attribute,
      value,
      acceptable,
    )

    if (existing !== null) {
      existing.incrementReferenceCount()
      return existing
    }

    const alphaMemory =
      new AZAlphaMemory(
        this.nextAlphaMemoryId,
        identifier,
        attribute,
        value,
        acceptable,
      )

    this.nextAlphaMemoryId += 1

    this.alphaMemories.push(alphaMemory)

    this.populateNewAlphaMemory(
      alphaMemory,
    )

    return alphaMemory
  }

  public removeReference(
    alphaMemory: AZAlphaMemory,
  ): void {
    if (
      !this.alphaMemories.includes(
        alphaMemory,
      )
    ) {
      throw new Error(
        `AZ alpha memory ${alphaMemory.id} is not registered`,
      )
    }

    const remainingReferences =
      alphaMemory.decrementReferenceCount()

    if (remainingReferences !== 0) {
      return
    }

    for (
      const rightMemory of
      [...alphaMemory.getRightMemories()]
    ) {
      const hashValue =
        this.getRightHashValue(
          alphaMemory,
          rightMemory.workingMemoryElement,
        )

      this.reteHashIndex.removeRight(
        rightMemory,
        hashValue,
      )

      alphaMemory.removeWorkingMemoryElement(
        rightMemory.workingMemoryElement,
      )
    }

    const index =
      this.alphaMemories.indexOf(
        alphaMemory,
      )

    if (index >= 0) {
      this.alphaMemories.splice(index, 1)
    }
  }

  public addWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): readonly AZAlphaMemory[] {
    const matched: AZAlphaMemory[] = []

    for (
      const alphaMemory of
      this.alphaMemories
    ) {
      const alreadyPresent =
        alphaMemory
          .getRightMemories()
          .some(
            (rightMemory) =>
              rightMemory
                .workingMemoryElement ===
              element,
          )

      if (alreadyPresent) {
        continue
      }

      const rightMemory =
        alphaMemory
          .addWorkingMemoryElement(
            element,
          )

      if (rightMemory === null) {
        continue
      }

      this.reteHashIndex.insertRight(
        rightMemory,
        this.getRightHashValue(
          alphaMemory,
          element,
        ),
      )

      matched.push(alphaMemory)
    }

    return matched
  }

  public removeWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): readonly AZAlphaMemory[] {
    const affected: AZAlphaMemory[] = []

    for (
      const alphaMemory of
      this.alphaMemories
    ) {
      const rightMemory =
        alphaMemory
          .getRightMemories()
          .find(
            (candidate) =>
              candidate
                .workingMemoryElement ===
              element,
          )

      if (rightMemory === undefined) {
        continue
      }

      this.reteHashIndex.removeRight(
        rightMemory,
        this.getRightHashValue(
          alphaMemory,
          element,
        ),
      )

      alphaMemory
        .removeWorkingMemoryElement(
          element,
        )

      affected.push(alphaMemory)
    }

    return affected
  }

  public getAlphaMemories():
    readonly AZAlphaMemory[] {
    return this.alphaMemories
  }

  private populateNewAlphaMemory(
    alphaMemory: AZAlphaMemory,
  ): void {
    const moreGeneral =
      this.findMoreGeneralAlphaMemory(
        alphaMemory,
      )

    const candidates:
      readonly AZWorkingMemoryElement[] =
      moreGeneral !== null
        ? moreGeneral
            .getRightMemories()
            .map(
              (rightMemory) =>
                rightMemory
                  .workingMemoryElement,
            )
        : this.workingMemory.getElements()

    for (const element of candidates) {
      const rightMemory =
        alphaMemory
          .addWorkingMemoryElement(
            element,
          )

      if (rightMemory === null) {
        continue
      }

      this.reteHashIndex.insertRight(
        rightMemory,
        this.getRightHashValue(
          alphaMemory,
          element,
        ),
      )
    }
  }

  private findMoreGeneralAlphaMemory(
    alphaMemory: AZAlphaMemory,
  ): AZAlphaMemory | null {
    if (alphaMemory.identifier !== null) {
      const withoutIdentifier =
        this.find(
          null,
          alphaMemory.attribute,
          alphaMemory.value,
          alphaMemory.acceptable,
        )

      if (withoutIdentifier !== null) {
        return withoutIdentifier
      }
    }

    if (alphaMemory.value !== null) {
      const withoutIdentifierAndValue =
        this.find(
          null,
          alphaMemory.attribute,
          null,
          alphaMemory.acceptable,
        )

      if (
        withoutIdentifierAndValue !== null
      ) {
        return withoutIdentifierAndValue
      }
    }

    return null
  }

  private getRightHashValue(
    alphaMemory: AZAlphaMemory,
    element: AZWorkingMemoryElement,
  ): number {
    return (
      alphaMemory.id ^
      element.identifier.hashId
    )
  }
}
