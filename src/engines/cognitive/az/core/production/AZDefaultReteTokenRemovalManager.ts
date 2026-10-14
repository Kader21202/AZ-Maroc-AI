import type { AZCnPartnerToken, AZCnToken } from './AZCnToken'
import type { AZMatchSet } from './AZMatchSet'
import type { AZProductionNodeActivator } from './AZProductionNodeActivator'
import type { AZProductionNode } from './AZProductionNode'
import type { AZPositiveNode } from './AZPositiveNode'
import type { AZReteChildLeftActivator } from './AZReteChildLeftActivator'
import type { AZReteHashIndex } from './AZReteHashIndex'
import type { AZReteLinkManager } from './AZReteLinkManager'
import type { AZReteNode } from './AZReteNode'
import type { AZReteTokenIdentityManager } from './AZReteTokenIdentityManager'
import type { AZReteTokenRemovalManager } from './AZReteTokenRemovalManager'
import type { AZToken } from './AZToken'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'

export class AZDefaultReteTokenRemovalManager
  implements AZReteTokenRemovalManager
{
  public constructor(
    private readonly hashIndex: AZReteHashIndex,
    private readonly tokenIdentityManager:
      AZReteTokenIdentityManager,
    private readonly productionNodeActivator:
      AZProductionNodeActivator,
    private readonly linkManager:
      AZReteLinkManager,
    private readonly identifierLinkStateRegistry?:
      AZIdentifierLinkStateRegistry,
  ) {}

  private childLeftActivator:
    AZReteChildLeftActivator | null = null

  public setChildLeftActivator(
    childLeftActivator: AZReteChildLeftActivator,
  ): void {
    this.childLeftActivator = childLeftActivator
  }

  public removeTokenAndSubtree(
    root: AZToken,
    matchSet: AZMatchSet,
  ): void {
    this.removeRecursively(
      root,
      matchSet,
    )
  }

  private removeRecursively(
    token: AZToken,
    matchSet: AZMatchSet,
  ): void {
    while (token.children.length > 0) {
      const child = token.children[0]

      if (!child) {
        break
      }

      this.removeRecursively(
        child,
        matchSet,
      )
    }

    const node = token.node

    if (node === null) {
      throw new Error(
        'AZ RETE token must belong to a node before removal',
      )
    }

    switch (node.type) {
      case 'MEMORY':
      case 'UNHASHED_MEMORY':
      case 'MP':
      case 'UNHASHED_MP':
      case 'NEGATIVE':
      case 'UNHASHED_NEGATIVE':
        this.removeFromLeftHash(
          token,
          node,
        )
        break

      case 'PRODUCTION': {
        if (!matchSet.cancelAssertion(token)) {
          const instantiation =
            node.production.instantiations.find(
              candidate =>
                candidate.reteToken === token.parent &&
                candidate.reteWme ===
                  token.workingMemoryElement,
            )

          if (instantiation === undefined) {
            throw new Error(
              `Cannot find AZ instantiation to retract for production ${node.production.name}`,
            )
          }

          instantiation.reteToken = null
          instantiation.reteWme = null

          const matchGoal = instantiation.matchGoal

          if (
            matchGoal !== null &&
            this.identifierLinkStateRegistry?.has(matchGoal) === true &&
            this.identifierLinkStateRegistry.get(matchGoal).linkCount === 0
          ) {
            matchSet.addNilGoalRetraction({
              instantiation,
              productionNode: node,
            })
          } else {
            matchSet.addRetraction({
              instantiation,
              productionNode: node,
            })
          }
        }

        break
      }

      case 'CN': {
        const cnToken =
          token as AZCnToken

        this.removeCnFromLeftHash(
          cnToken,
          node,
        )

        for (const blocker of [
          ...cnToken.cnPartnerTokens,
        ]) {
          this.removeCnPartnerBlockerDirectly(
            blocker,
          )
        }

        cnToken.cnPartnerTokens.length = 0

        break
      }

      case 'CN_PARTNER': {
        const partnerToken =
          token as AZCnPartnerToken

        const leftToken =
          partnerToken.leftToken

        const blockerIndex =
          leftToken.cnPartnerTokens.indexOf(
            partnerToken,
          )

        if (blockerIndex < 0) {
          throw new Error(
            'AZ CN partner blocker is missing from its left token',
          )
        }

        leftToken.cnPartnerTokens.splice(
          blockerIndex,
          1,
        )

        if (
          leftToken.cnPartnerTokens.length === 0
        ) {
          for (const child of
            leftToken.node?.children ?? []) {
            if (this.childLeftActivator !== null) {
              this.childLeftActivator.activateChildLeft(
                child as AZReteNode,
                leftToken,
                null,
                matchSet,
              )
              continue
            }

            if (child.type === 'PRODUCTION') {
              this.productionNodeActivator.activate(
                child as AZProductionNode,
                leftToken,
                null,
                matchSet,
              )
              continue
            }

            throw new Error(
              'AZ RETE child-left activator must be configured before non-production CN reactivation',
            )
          }
        }

        break
      }

      case 'DUMMY_TOP':
      case 'DUMMY_MATCHES':
        throw new Error(
          `AZ RETE token removal is invalid for ${node.type}`,
        )
    }

    if (
      node.type === 'NEGATIVE' ||
      node.type === 'UNHASHED_NEGATIVE'
    ) {
      token.negativeMatches.length = 0
    }

    this.removeFromNode(
      token,
      node,
    )

    if (
      (node.type === 'MP' ||
        node.type === 'UNHASHED_MP') &&
      node.tokens.length === 0 &&
      !this.linkManager.isMpLeftUnlinked(node) &&
      !this.linkManager.isRightUnlinked(node)
    ) {
      this.linkManager.unlinkRight(node)
    }

    if (
      (node.type === 'NEGATIVE' ||
        node.type === 'UNHASHED_NEGATIVE') &&
      node.tokens.length === 0 &&
      !this.linkManager.isRightUnlinked(node)
    ) {
      this.linkManager.unlinkRight(node)
    }

    if (
      (node.type === 'MEMORY' ||
        node.type === 'UNHASHED_MEMORY') &&
      node.tokens.length === 0
    ) {
      for (const child of node.children) {
        if (
          child.type !== 'POSITIVE' &&
          child.type !== 'UNHASHED_POSITIVE'
        ) {
          continue
        }

        const positiveChild =
          child as AZPositiveNode

        if (
          !this.linkManager.isPositiveLeftUnlinked(
            positiveChild,
          ) &&
          !this.linkManager.isRightUnlinked(
            positiveChild,
          )
        ) {
          this.linkManager.unlinkRight(
            positiveChild,
          )
        }
      }
    }

    if (token.parent !== null) {
      const index =
        token.parent.children.indexOf(token)

      if (index >= 0) {
        token.parent.children.splice(
          index,
          1,
        )
      }
    }

    token.children.length = 0
    token.node = null
  }

  private removeFromLeftHash(
    token: AZToken,
    node: AZReteNode,
  ): void {
    if (node.nodeId === null) {
      throw new Error(
        'AZ hashed RETE token node must have a nodeId',
      )
    }

    const hashValue =
      node.nodeId ^
      (token.hashReferent?.hashId ?? 0)

    this.hashIndex.removeLeft(
      token,
      hashValue,
    )
  }

  private removeFromNode(
    token: AZToken,
    node: AZReteNode,
  ): void {
    if (!('tokens' in node)) {
      return
    }

    const index =
      node.tokens.indexOf(token)

    if (index >= 0) {
      node.tokens.splice(
        index,
        1,
      )
    }
  }

  private removeCnFromLeftHash(
    token: AZCnToken,
    node: AZReteNode,
  ): void {
    if (node.nodeId === null) {
      throw new Error(
        'AZ CN RETE node requires a nodeId',
      )
    }

    const parentIdentity =
      token.parent === null
        ? 0
        : this.tokenIdentityManager.getIdentity(
            token.parent,
          )

    const wmeIdentity =
      token.workingMemoryElement?.timetag ?? 0

    this.hashIndex.removeLeft(
      token,
      node.nodeId ^
        parentIdentity ^
        wmeIdentity,
    )
  }

  private removeCnPartnerBlockerDirectly(
    token: AZCnPartnerToken,
  ): void {
    const node = token.node

    if (
      node === null ||
      node.type !== 'CN_PARTNER'
    ) {
      throw new Error(
        'AZ CN partner blocker must belong to a CN_PARTNER node',
      )
    }

    this.removeFromNode(
      token,
      node,
    )

    if (token.parent !== null) {
      const index =
        token.parent.children.indexOf(token)

      if (index >= 0) {
        token.parent.children.splice(
          index,
          1,
        )
      }
    }

    token.children.length = 0
    token.node = null
  }
}
