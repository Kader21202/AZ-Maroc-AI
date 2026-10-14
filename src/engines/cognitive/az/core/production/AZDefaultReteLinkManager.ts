import type { AZReteLinkManager } from './AZReteLinkManager'
import type { AZMpNode } from './AZMpNode'
import type { AZNegativeNode } from './AZNegativeNode'
import type { AZPositiveNode } from './AZPositiveNode'

type AZRightLinkedNode =
  | AZPositiveNode
  | AZMpNode
  | AZNegativeNode

export class AZDefaultReteLinkManager
  implements AZReteLinkManager
{
  public isRightUnlinked(
    node: AZRightLinkedNode,
  ): boolean {
    return node.rightUnlinked
  }

  public linkRight(
    node: AZRightLinkedNode,
  ): void {
    if (!node.rightUnlinked) {
      return
    }

    node.alphaMemory.addBetaNode(node)
    node.rightUnlinked = false
  }

  public unlinkRight(
    node: AZRightLinkedNode,
  ): void {
    if (node.rightUnlinked) {
      return
    }

    node.alphaMemory.removeBetaNode(node)
    node.rightUnlinked = true
  }

  public isPositiveLeftUnlinked(
    node: AZPositiveNode,
  ): boolean {
    return node.leftUnlinked
  }

  public linkPositiveLeft(
    node: AZPositiveNode,
  ): void {
    node.leftUnlinked = false
  }

  public unlinkPositiveLeft(
    node: AZPositiveNode,
  ): void {
    node.leftUnlinked = true
  }

  public isMpLeftUnlinked(
    node: AZMpNode,
  ): boolean {
    return node.leftUnlinked
  }

  public linkMpLeft(
    node: AZMpNode,
  ): void {
    node.leftUnlinked = false
  }

  public unlinkMpLeft(
    node: AZMpNode,
  ): void {
    node.leftUnlinked = true
  }
}
