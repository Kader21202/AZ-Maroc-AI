import type { AZMemoryNode } from './AZMemoryNode'
import type { AZMpNode } from './AZMpNode'
import type { AZPositiveNode } from './AZPositiveNode'
import type { AZReteMpNodeManager } from './AZReteMpNodeManager'
import type { AZReteNode } from './AZReteNode'
import type { AZReteNodeFactory } from './AZReteNodeFactory'

export class AZDefaultReteMpNodeManager
  implements AZReteMpNodeManager
{
  public constructor(
    private readonly nodeFactory:
      AZReteNodeFactory,
  ) {}

  public splitMpNode(
    mpNode: AZMpNode,
  ): AZMemoryNode {
    const parent = mpNode.parent

    if (parent === null) {
      throw new Error(
        'MP node must have a parent before splitting',
      )
    }

    if (mpNode.nodeId === null) {
      throw new Error(
        'MP node must have a nodeId before splitting',
      )
    }

    const parentIndex =
      parent.children.indexOf(mpNode)

    if (parentIndex < 0) {
      throw new Error(
        'MP node must be registered as a child of its parent',
      )
    }

    const hashed = mpNode.type === 'MP'

    const location = {
      fieldNumber:
        mpNode.leftHashFieldNumber ?? 0,
      levelsUp:
        mpNode.leftHashLevelsUp ?? 0,
    } as const

    parent.children.splice(parentIndex, 1)
    mpNode.alphaMemory.removeBetaNode(mpNode)

    const memoryNode =
      this.nodeFactory.createMemoryNode(
        parent as AZReteNode,
        hashed,
        location,
        mpNode.nodeId,
      )

    const positiveNode =
      this.nodeFactory.createPositiveNode(
        memoryNode,
        hashed,
        mpNode.alphaMemory,
        mpNode.tests,
      )

    positiveNode.leftUnlinked =
      mpNode.leftUnlinked

    memoryNode.tokens.push(
      ...mpNode.tokens,
    )

    for (const token of memoryNode.tokens) {
      token.node = memoryNode
    }

    mpNode.tokens.length = 0

    positiveNode.children.push(
      ...mpNode.children,
    )

    for (
      const child of positiveNode.children
    ) {
      child.parent = positiveNode
    }

    mpNode.children.length = 0

    return memoryNode
  }

  public mergeIntoMpNode(
    memoryNode: AZMemoryNode,
  ): AZMpNode {
    const parent = memoryNode.parent

    if (parent === null) {
      throw new Error(
        'Memory node must have a parent before merging',
      )
    }

    if (memoryNode.nodeId === null) {
      throw new Error(
        'Memory node must have a nodeId before merging',
      )
    }

    if (memoryNode.children.length !== 1) {
      throw new Error(
        'Memory node must have exactly one child before merging into MP',
      )
    }

    const positiveNode =
      memoryNode.children[0]

    if (
      positiveNode === undefined ||
      !this.isPositiveNode(positiveNode)
    ) {
      throw new Error(
        'Memory node child must be a positive node before merging into MP',
      )
    }

    const parentIndex =
      parent.children.indexOf(memoryNode)

    if (parentIndex < 0) {
      throw new Error(
        'Memory node must be registered as a child of its parent',
      )
    }

    const hashed =
      memoryNode.type === 'MEMORY'

    const location = {
      fieldNumber:
        memoryNode.leftHashFieldNumber ?? 0,
      levelsUp:
        memoryNode.leftHashLevelsUp ?? 0,
    } as const

    parent.children.splice(parentIndex, 1)

    positiveNode.alphaMemory.removeBetaNode(
      positiveNode,
    )

    const mpNode =
      this.nodeFactory.createMpNode(
        parent as AZReteNode,
        hashed,
        location,
        positiveNode.alphaMemory,
        positiveNode.tests,
        memoryNode.nodeId,
      )

    mpNode.leftUnlinked =
      positiveNode.leftUnlinked

    mpNode.tokens.push(
      ...memoryNode.tokens,
    )

    for (const token of mpNode.tokens) {
      token.node = mpNode
    }

    memoryNode.tokens.length = 0

    mpNode.children.push(
      ...positiveNode.children,
    )

    for (const child of mpNode.children) {
      child.parent = mpNode
    }

    positiveNode.children.length = 0
    memoryNode.children.length = 0

    return mpNode
  }

  private isPositiveNode(
    node: {
      readonly type: string
    },
  ): node is AZPositiveNode {
    return (
      node.type === 'POSITIVE' ||
      node.type === 'UNHASHED_POSITIVE'
    )
  }
}
