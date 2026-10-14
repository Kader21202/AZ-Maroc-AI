import type { AZMatchSet } from './AZMatchSet'
import type { AZReteLinkManager } from './AZReteLinkManager'
import type { AZReteMpNodeManager } from './AZReteMpNodeManager'
import type { AZReteNode } from './AZReteNode'
import type { AZReteNodeRemovalManager } from './AZReteNodeRemovalManager'
import type { AZReteTokenRemovalManager } from './AZReteTokenRemovalManager'

export class AZDefaultReteNodeRemovalManager
  implements AZReteNodeRemovalManager
{
  public constructor(
    private readonly linkManager:
      AZReteLinkManager,
    private readonly mpNodeManager:
      AZReteMpNodeManager,
    private readonly tokenRemovalManager:
      AZReteTokenRemovalManager,
  ) {}

  public removeNode(
    node: AZReteNode,
    matchSet: AZMatchSet,
  ): void {
    if (node.type === 'DUMMY_TOP') {
      throw new Error(
        'DUMMY_TOP RETE node cannot be removed',
      )
    }

    if (node.type === 'PRODUCTION') {
      throw new Error(
        'PRODUCTION RETE node must be removed through production excision',
      )
    }

    if (node.type === 'CN') {
      const partner = node.partner

      if (
        partner === null ||
        partner.type !== 'CN_PARTNER'
      ) {
        throw new Error(
          'CN node requires a CN_PARTNER before removal',
        )
      }

      const partnerParent = partner.parent

      if (partnerParent === null) {
        throw new Error(
          'CN_PARTNER must have a parent before removal',
        )
      }

      const partnerIndex =
        partnerParent.children.indexOf(partner)

      if (partnerIndex < 0) {
        throw new Error(
          'CN_PARTNER must be registered as a child of its parent',
        )
      }

      partnerParent.children.splice(
        partnerIndex,
        1,
      )

      partner.parent = null
      partner.partner = null
      node.partner = null
    }

    const parent = node.parent

    if (parent === null) {
      throw new Error(
        'RETE node must have a parent before removal',
      )
    }

    if ('tokens' in node) {
      while (node.tokens.length > 0) {
        const token = node.tokens[0]

        if (token === undefined) {
          break
        }

        this.tokenRemovalManager
          .removeTokenAndSubtree(
            token,
            matchSet,
          )
      }
    }

    if (
      node.type === 'POSITIVE' ||
      node.type === 'UNHASHED_POSITIVE' ||
      node.type === 'NEGATIVE' ||
      node.type === 'UNHASHED_NEGATIVE' ||
      node.type === 'MP' ||
      node.type === 'UNHASHED_MP'
    ) {
      if (
        !this.linkManager
          .isRightUnlinked(node)
      ) {
        this.linkManager.unlinkRight(node)
      }
    }

    const index =
      parent.children.indexOf(node)

    if (index < 0) {
      throw new Error(
        'RETE node must be registered as a child of its parent',
      )
    }

    parent.children.splice(index, 1)
    node.parent = null

    if (
      (
        node.type === 'POSITIVE' ||
        node.type === 'UNHASHED_POSITIVE'
      ) &&
      (
        parent.type === 'MEMORY' ||
        parent.type === 'UNHASHED_MEMORY'
      ) &&
      parent.children.length === 1
    ) {
      const remainingChild =
        parent.children[0]

      if (
        remainingChild !== undefined &&
        (
          remainingChild.type === 'POSITIVE' ||
          remainingChild.type === 'UNHASHED_POSITIVE'
        )
      ) {
        this.mpNodeManager.mergeIntoMpNode(
          parent as never,
        )
        return
      }
    }

    if (
      parent.type !== 'DUMMY_TOP' &&
      parent.children.length === 0
    ) {
      this.removeNode(
        parent as AZReteNode,
        matchSet,
      )
    }
  }
}
