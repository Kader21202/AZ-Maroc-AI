import type { AZRightLinkedReteNode } from './AZRightLinkedReteNode'
import type { AZReteNode } from './AZReteNode'
import type { AZRightMemory } from './AZRightMemory'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'

export class AZAlphaMemory {
  private readonly rightMemories: AZRightMemory[] = []
  private readonly betaNodes: AZRightLinkedReteNode[] = []

  public constructor(
    public readonly id: number,
    public readonly identifier: AZSymbol | null,
    public readonly attribute: AZSymbol | null,
    public readonly value: AZSymbol | null,
    public readonly acceptable: boolean,
    public referenceCount = 1,
  ) {}

  public matches(
    element: AZWorkingMemoryElement,
  ): boolean {
    return (
      (this.identifier === null ||
        this.identifier === element.identifier) &&
      (this.attribute === null ||
        this.attribute === element.attribute) &&
      (this.value === null ||
        this.value === element.value) &&
      this.acceptable === element.acceptable
    )
  }

  public addWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): AZRightMemory | null {
    if (!this.matches(element)) {
      return null
    }

    const existing = this.rightMemories.find(
      (rightMemory) =>
        rightMemory.workingMemoryElement === element,
    )

    if (existing) {
      return existing
    }

    const rightMemory: AZRightMemory = {
      workingMemoryElement: element,
      alphaMemoryId: this.id,
    }

    this.rightMemories.push(rightMemory)

    return rightMemory
  }

  public removeWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): boolean {
    const index = this.rightMemories.findIndex(
      (rightMemory) =>
        rightMemory.workingMemoryElement === element,
    )

    if (index < 0) {
      return false
    }

    this.rightMemories.splice(index, 1)

    return true
  }

  public getRightMemories():
    readonly AZRightMemory[] {
    return this.rightMemories
  }

  public addBetaNode(
    node: AZRightLinkedReteNode,
  ): void {
    if (this.betaNodes.includes(node)) {
      return
    }

    const ancestor =
      this.findNearestLinkedAncestorWithSameAlphaMemory(
        node,
      )

    if (ancestor === null) {
      this.betaNodes.push(node)
      return
    }

    const ancestorIndex =
      this.betaNodes.indexOf(ancestor)

    if (ancestorIndex < 0) {
      this.betaNodes.push(node)
      return
    }

    this.betaNodes.splice(
      ancestorIndex,
      0,
      node,
    )
  }

  private findNearestLinkedAncestorWithSameAlphaMemory(
    node: AZRightLinkedReteNode,
  ): AZRightLinkedReteNode | null {
    let current: AZReteNode | null =
      node

    while (
      current !== null &&
      current.type !== 'DUMMY_TOP'
    ) {
      if (
        current.type === 'CN' &&
        current.partner !== null
      ) {
        current =
          current.partner.parent as
            AZReteNode | null
      } else {
        const parent =
          current.parent as
            AZReteNode | null

        if (
          (
            current.type === 'POSITIVE' ||
            current.type ===
              'UNHASHED_POSITIVE'
          ) &&
          parent !== null &&
          (
            parent.type === 'MEMORY' ||
            parent.type ===
              'UNHASHED_MEMORY'
          )
        ) {
          current =
            parent.parent as
              AZReteNode | null
        } else {
          current = parent
        }
      }

      if (
        current !== null &&
        (
          current.type === 'POSITIVE' ||
          current.type ===
            'UNHASHED_POSITIVE' ||
          current.type === 'MP' ||
          current.type === 'UNHASHED_MP' ||
          current.type === 'NEGATIVE' ||
          current.type ===
            'UNHASHED_NEGATIVE'
        ) &&
        current.alphaMemory === this &&
        !current.rightUnlinked
      ) {
        return current
      }
    }

    return null
  }

  public removeBetaNode(
    node: AZRightLinkedReteNode,
  ): boolean {
    const index = this.betaNodes.indexOf(node)

    if (index < 0) {
      return false
    }

    this.betaNodes.splice(index, 1)

    return true
  }

  public getBetaNodes():
    readonly AZRightLinkedReteNode[] {
    return this.betaNodes
  }

  public incrementReferenceCount(): number {
    this.referenceCount += 1
    return this.referenceCount
  }

  public decrementReferenceCount(): number {
    if (this.referenceCount === 0) {
      return 0
    }

    this.referenceCount -= 1
    return this.referenceCount
  }
}
