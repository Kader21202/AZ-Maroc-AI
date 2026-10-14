import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZAlphaMemory } from './AZAlphaMemory'
import type { AZCnNode } from './AZCnNode'
import type { AZCnPartnerToken, AZCnToken } from './AZCnToken'
import { AZDefaultReteParentResolver } from './AZDefaultReteParentResolver'
import type { AZMatchSet } from './AZMatchSet'
import type { AZMemoryNode } from './AZMemoryNode'
import type { AZMpNode } from './AZMpNode'
import type { AZNegativeNode } from './AZNegativeNode'
import type { AZPositiveNode } from './AZPositiveNode'
import type { AZProductionNodeActivator } from './AZProductionNodeActivator'
import type { AZReteActivationEngine } from './AZReteActivationEngine'
import type { AZReteChildLeftActivator } from './AZReteChildLeftActivator'
import type { AZReteHashIndex } from './AZReteHashIndex'
import type { AZReteHashReferentResolver } from './AZReteHashReferentResolver'
import type { AZReteLinkManager } from './AZReteLinkManager'
import type { AZReteNode } from './AZReteNode'
import type { AZReteTestMatcher } from './AZReteTestMatcher'
import type { AZReteTokenIdentityManager } from './AZReteTokenIdentityManager'
import type { AZReteTokenRemovalManager } from './AZReteTokenRemovalManager'
import type { AZToken } from './AZToken'

export class AZDefaultReteActivationEngine
  implements AZReteActivationEngine, AZReteChildLeftActivator
{
  private readonly dummyMatchTokens: AZToken[] = []

  private readonly reteParentResolver =
    new AZDefaultReteParentResolver()

  public constructor(
    private readonly testMatcher: AZReteTestMatcher,
    private readonly productionNodeActivator:
      AZProductionNodeActivator,
    private readonly hashIndex: AZReteHashIndex,
    private readonly hashReferentResolver:
      AZReteHashReferentResolver,
    private readonly tokenRemovalManager:
      AZReteTokenRemovalManager,
    private readonly tokenIdentityManager:
      AZReteTokenIdentityManager,
    private readonly linkManager:
      AZReteLinkManager,
  ) {}

  public updateNodeWithMatchesFromAbove(
    child: AZReteNode,
    matchSet: AZMatchSet,
  ): void {
    const parent = child.parent

    if (parent === null) {
      throw new Error(
        'AZ RETE update from above requires a parent node',
      )
    }

    if (parent.type === 'DUMMY_TOP') {
      let dummyMatchToken =
        this.dummyMatchTokens[0]

      if (dummyMatchToken === undefined) {
        dummyMatchToken = {
          parent: null,
          workingMemoryElement: null,
          node: null,
          hashReferent: null,
          negativeMatches: [],
          children: [],
        }

        this.dummyMatchTokens.push(
          dummyMatchToken,
        )
      }

      this.activateChildLeft(
        child,
        dummyMatchToken,
        null,
        matchSet,
      )
      return
    }

    if (
      parent.type === 'POSITIVE' ||
      parent.type === 'UNHASHED_POSITIVE'
    ) {
      if (!('alphaMemory' in parent)) {
        throw new Error(
          'AZ RETE positive parent has invalid structure',
        )
      }

      const positiveParent =
        parent as AZPositiveNode

      if (
        this.linkManager.isRightUnlinked(
          positiveParent,
        )
      ) {
        return
      }

      const savedChildren =
        [...positiveParent.children]

      positiveParent.children.length = 0
      positiveParent.children.push(child)

      try {
        for (
          const rightMemory
          of positiveParent.alphaMemory.getRightMemories()
        ) {
          this.activatePositiveRight(
            positiveParent,
            rightMemory.workingMemoryElement,
            matchSet,
          )
        }
      } finally {
        positiveParent.children.length = 0
        positiveParent.children.push(
          ...savedChildren,
        )
      }

      return
    }
    if (
      parent.type === 'MP' ||
      parent.type === 'UNHASHED_MP'
    ) {
      if (!('alphaMemory' in parent)) {
        throw new Error(
          'AZ RETE MP parent has invalid structure',
        )
      }

      const mpParent =
        parent as AZMpNode

      if (
        this.linkManager.isRightUnlinked(
          mpParent,
        )
      ) {
        return
      }

      const savedChildren =
        [...mpParent.children]

      mpParent.children.length = 0
      mpParent.children.push(child)

      try {
        for (
          const rightMemory
          of mpParent.alphaMemory.getRightMemories()
        ) {
          this.activateMpRight(
            mpParent,
            rightMemory.workingMemoryElement,
            matchSet,
          )
        }
      } finally {
        mpParent.children.length = 0
        mpParent.children.push(
          ...savedChildren,
        )
      }

      return
    }
    if (
      parent.type === 'NEGATIVE' ||
      parent.type === 'UNHASHED_NEGATIVE'
    ) {
      if (!('tokens' in parent)) {
        throw new Error(
          'AZ RETE negative parent has invalid structure',
        )
      }

      const negativeParent =
        parent as AZNegativeNode

      for (const token of negativeParent.tokens) {
        if (token.negativeMatches.length !== 0) {
          continue
        }

        this.activateChildLeft(
          child,
          token,
          null,
          matchSet,
        )
      }

      return
    }

    if (parent.type === 'CN') {
      if (!('tokens' in parent)) {
        throw new Error(
          'AZ RETE CN parent has invalid structure',
        )
      }

      const cnParent =
        parent as AZCnNode

      for (const token of cnParent.tokens) {
        if (!('cnPartnerTokens' in token)) {
          throw new Error(
            'AZ RETE CN token has invalid structure',
          )
        }

        const cnToken =
          token as AZCnToken

        if (cnToken.cnPartnerTokens.length !== 0) {
          continue
        }

        this.activateChildLeft(
          child,
          cnToken,
          null,
          matchSet,
        )
      }

      return
    }

    throw new Error(
      `AZ RETE update from above is not yet implemented for parent ${parent.type}`,
    )
  }

  public activateChildLeft(
    child: AZReteNode,
    parentToken: AZToken | null,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): void {
    switch (child.type) {
      case 'MEMORY':
      case 'UNHASHED_MEMORY':
        this.activateMemoryLeft(
          child,
          parentToken,
          workingMemoryElement,
          matchSet,
        )
        return

      case 'POSITIVE':
      case 'UNHASHED_POSITIVE':
        if (parentToken === null) {
          throw new Error(
            'AZ RETE positive activation requires a parent token',
          )
        }

        this.activatePositiveLeft(
          child,
          parentToken,
          matchSet,
        )
        return

      case 'MP':
      case 'UNHASHED_MP':
        if (parentToken === null) {
          throw new Error(
            'AZ RETE MP activation requires a parent token',
          )
        }

        this.activateMpLeft(
          child,
          parentToken,
          workingMemoryElement,
          matchSet,
        )
        return

      case 'NEGATIVE':
      case 'UNHASHED_NEGATIVE':
        this.activateNegativeLeft(
          child,
          parentToken,
          workingMemoryElement,
          matchSet,
        )
        return

      case 'CN':
        this.activateCnLeft(
          child,
          parentToken,
          workingMemoryElement,
          matchSet,
        )
        return

      case 'CN_PARTNER':
        if (parentToken === null) {
          throw new Error(
            'AZ RETE CN-partner activation requires a parent token',
          )
        }

        this.activateCnPartnerLeft(
          child,
          parentToken,
          workingMemoryElement,
          matchSet,
        )
        return

      case 'PRODUCTION':
        if (parentToken === null) {
          throw new Error(
            'AZ RETE production activation requires a parent token',
          )
        }

        this.productionNodeActivator.activate(
          child,
          parentToken,
          workingMemoryElement,
          matchSet,
        )
        return

      case 'DUMMY_MATCHES': {
    const token: AZToken = {
          parent: parentToken,
          workingMemoryElement,
          node: null,
          hashReferent: null,
          negativeMatches: [],
          children: [],
        }

        this.dummyMatchTokens.unshift(token)
        return
      }

      default:
        throw new Error(
          `AZ RETE left activation is not yet implemented for ${child.type}`,
        )
    }
  }

  public activateMemoryLeft(
    node: AZMemoryNode,
    parentToken: AZToken | null,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken {
    if (node.nodeId === null) {
      throw new Error(
        'AZ RETE memory node requires a nodeId',
      )
    }

    let hashReferent = null
    let hashValue = node.nodeId

    if (node.type === 'MEMORY') {
      if (
        node.leftHashFieldNumber === null ||
        node.leftHashLevelsUp === null
      ) {
        throw new Error(
          'AZ RETE hashed memory requires a hash location',
        )
      }

      hashReferent =
        this.hashReferentResolver.resolve(
          parentToken,
          workingMemoryElement,
          {
            levelsUp: node.leftHashLevelsUp,
            fieldNumber:
              node.leftHashFieldNumber,
          },
        )

      hashValue =
        node.nodeId ^ hashReferent.hashId
    }

    const token: AZToken = {
      parent: parentToken,
      workingMemoryElement,
      node,
      hashReferent,
      negativeMatches: [],
      children: [],
    }

    node.tokens.push(token)

    if (parentToken !== null) {
      parentToken.children.push(token)
    }

    this.hashIndex.insertLeft(
      token,
      hashValue,
    )

    for (const child of node.children) {
      if (node.type === 'UNHASHED_MEMORY') {
        if (child.type !== 'UNHASHED_POSITIVE') {
          continue
        }

        const positiveChild =
          child as AZPositiveNode

        if (positiveChild.leftUnlinked) {
          continue
        }

        this.activatePositiveLeft(
          positiveChild,
          token,
          matchSet,
        )

        continue
      }

      if (child.type !== 'POSITIVE') {
        continue
      }

      const positiveChild =
        child as AZPositiveNode

      if (positiveChild.leftUnlinked) {
        continue
      }

      this.activatePositiveLeft(
        positiveChild,
        token,
        matchSet,
      )
    }

    return token
  }

  public removeWorkingMemoryElement(
    element: AZWorkingMemoryElement,
    affectedAlphaMemories:
      readonly AZAlphaMemory[],
    matchSet: AZMatchSet,
  ): void {
    for (
      const alphaMemory of
      affectedAlphaMemories
    ) {
      for (
        const betaNode of
        alphaMemory.getBetaNodes()
      ) {
        switch (betaNode.type) {
          case 'POSITIVE':
          case 'UNHASHED_POSITIVE': {
            this.removeDescendantTokensForWme(
              betaNode,
              element,
              matchSet,
            )

            if (
              alphaMemory
                .getRightMemories()
                .length === 0
            ) {
              this.linkManager
                .unlinkPositiveLeft(
                  betaNode,
                )
            }

            break
          }

          case 'MP':
          case 'UNHASHED_MP': {
            this.removeDescendantTokensForWme(
              betaNode,
              element,
              matchSet,
            )

            if (
              alphaMemory
                .getRightMemories()
                .length === 0
            ) {
              this.linkManager
                .unlinkMpLeft(betaNode)
            }

            break
          }

          case 'NEGATIVE':
          case 'UNHASHED_NEGATIVE': {
            for (
              const token of betaNode.tokens
            ) {
              const previousCount =
                token.negativeMatches.length

              token.negativeMatches =
                token.negativeMatches.filter(
                  (negativeMatch) =>
                    negativeMatch
                      .workingMemoryElement !==
                    element,
                )

              if (
                previousCount > 0 &&
                token.negativeMatches
                  .length === 0
              ) {
                for (
                  const child of
                  betaNode.children
                ) {
                  this.activateChildLeft(
                    child as AZReteNode,
                    token,
                    null,
                    matchSet,
                  )
                }
              }
            }

            break
          }

          default:
            break
        }
      }
    }
  }

  private removeDescendantTokensForWme(
    node:
      | AZPositiveNode
      | AZMpNode,
    element: AZWorkingMemoryElement,
    matchSet: AZMatchSet,
  ): void {
    const removeMatchingDescendants = (
      token: AZToken,
    ): void => {
      for (
        const child of [...token.children]
      ) {
        if (
          child.workingMemoryElement ===
          element
        ) {
          this.tokenRemovalManager
            .removeTokenAndSubtree(
              child,
              matchSet,
            )

          continue
        }

        removeMatchingDescendants(child)
      }
    }

    const hasTokenCollection = (
      candidate: object,
    ): candidate is { tokens: AZToken[] } =>
      'tokens' in candidate &&
      Array.isArray(candidate.tokens)

    const sourceTokens: readonly AZToken[] =
      node.type === 'MP' ||
      node.type === 'UNHASHED_MP'
        ? node.tokens
        : (
            node.parent !== null &&
            hasTokenCollection(node.parent)
          )
          ? node.parent.tokens
          : []

    for (const token of sourceTokens) {
      removeMatchingDescendants(token)
    }
  }

  public activatePositiveLeft(
    node: AZPositiveNode,
    token: AZToken,
    matchSet: AZMatchSet,
  ): readonly AZWorkingMemoryElement[] {
    if (this.linkManager.isRightUnlinked(node)) {
      this.linkManager.linkRight(node)
    }

    if (
      node.alphaMemory.getRightMemories().length === 0
    ) {
      this.linkManager.unlinkPositiveLeft(node)
      return []
    }

    let rightMemories

    if (node.type === 'POSITIVE') {
      const hashReferent = token.hashReferent

      if (hashReferent === null) {
        throw new Error(
          'AZ RETE hashed positive activation requires a token hash referent',
        )
      }

      const hashValue =
        node.alphaMemory.id ^
        hashReferent.hashId

      rightMemories =
        this.hashIndex
          .getRightBucket(hashValue)
          .filter(
            (rightMemory) =>
              rightMemory.alphaMemoryId ===
                node.alphaMemory.id &&
              rightMemory
                .workingMemoryElement
                .identifier === hashReferent,
          )
    } else {
      rightMemories =
        node.alphaMemory.getRightMemories()
    }

    const matchedElements:
      AZWorkingMemoryElement[] = []

    for (const rightMemory of rightMemories) {
      const element =
        rightMemory.workingMemoryElement

      if (
        !this.testMatcher.matchesAll(
          node.tests,
          token,
          element,
        )
      ) {
        continue
      }

      matchedElements.push(element)

      for (const child of node.children) {
        this.activateChildLeft(
          child as AZReteNode,
          token,
          element,
          matchSet,
        )
      }
    }

    return matchedElements
  }

  public activatePositiveRight(
    node: AZPositiveNode,
    workingMemoryElement:
      AZWorkingMemoryElement,
    matchSet: AZMatchSet,
  ): readonly AZToken[] {
    const parent = node.parent

    if (
      parent === null ||
      parent.nodeId === null
    ) {
      throw new Error(
        'AZ RETE positive-right activation requires a parent node with nodeId',
      )
    }

    if (
      this.linkManager
        .isPositiveLeftUnlinked(node)
    ) {
      this.linkManager
        .linkPositiveLeft(node)

      if (
        parent.type !== 'MEMORY' &&
        parent.type !== 'UNHASHED_MEMORY'
      ) {
        throw new Error(
          'AZ RETE positive-right activation requires a memory parent node',
        )
      }

      const memoryParent =
        parent as AZMemoryNode

      if (memoryParent.tokens.length === 0) {
        this.linkManager.unlinkRight(node)
        return []
      }
    }

    const hashValue =
      node.type === 'POSITIVE'
        ? parent.nodeId ^
          workingMemoryElement.identifier.hashId
        : parent.nodeId

    const matchedTokens: AZToken[] = []

    for (
      const token of
      [...this.hashIndex.getLeftBucket(hashValue)]
    ) {
      if (token.node !== parent) {
        continue
      }

      if (
        node.type === 'POSITIVE' &&
        token.hashReferent !==
          workingMemoryElement.identifier
      ) {
        continue
      }

      if (
        !this.testMatcher.matchesAll(
          node.tests,
          token,
          workingMemoryElement,
        )
      ) {
        continue
      }

      matchedTokens.push(token)

      for (const child of node.children) {
        this.activateChildLeft(
          child as AZReteNode,
          token,
          workingMemoryElement,
          matchSet,
        )
      }
    }

    return matchedTokens
  }

  public activateMpLeft(
    node: AZMpNode,
    parentToken: AZToken | null,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken {
    if (node.nodeId === null) {
      throw new Error(
        'AZ RETE MP node requires a nodeId',
      )
    }

    let hashReferent = null
    let hashValue = node.nodeId

    if (node.type === 'MP') {
      if (
        node.leftHashFieldNumber === null ||
        node.leftHashLevelsUp === null
      ) {
        throw new Error(
          'AZ RETE hashed MP requires a hash location',
        )
      }

      hashReferent =
        this.hashReferentResolver.resolve(
          parentToken,
          workingMemoryElement,
          {
            levelsUp: node.leftHashLevelsUp,
            fieldNumber:
              node.leftHashFieldNumber,
          },
        )

      hashValue =
        node.nodeId ^ hashReferent.hashId
    }

    const token: AZToken = {
      parent: parentToken,
      workingMemoryElement,
      node,
      hashReferent,
      negativeMatches: [],
      children: [],
    }

    node.tokens.push(token)

    if (parentToken !== null) {
      parentToken.children.push(token)
    }

    this.hashIndex.insertLeft(
      token,
      hashValue,
    )

    if (
      this.linkManager.isMpLeftUnlinked(node)
    ) {
      return token
    }

    if (
      this.linkManager.isRightUnlinked(node)
    ) {
      this.linkManager.linkRight(node)
    }

    if (
      node.alphaMemory.getRightMemories().length === 0
    ) {
      this.linkManager.unlinkMpLeft(node)
      return token
    }

    let rightMemories

    if (node.type === 'MP') {
      if (hashReferent === null) {
        throw new Error(
          'AZ RETE hashed MP activation requires a hash referent',
        )
      }

      rightMemories =
        this.hashIndex
          .getRightBucket(
            node.alphaMemory.id ^
              hashReferent.hashId,
          )
          .filter(
            (rightMemory) =>
              rightMemory.alphaMemoryId ===
                node.alphaMemory.id &&
              rightMemory
                .workingMemoryElement
                .identifier === hashReferent,
          )
    } else {
      rightMemories =
        node.alphaMemory.getRightMemories()
    }

    for (const rightMemory of rightMemories) {
      const element =
        rightMemory.workingMemoryElement

      if (
        !this.testMatcher.matchesAll(
          node.tests,
          token,
          element,
        )
      ) {
        continue
      }

      for (const child of node.children) {
        this.activateChildLeft(
          child as AZReteNode,
          token,
          element,
          matchSet,
        )
      }
    }

    return token
  }

  public activateMpRight(
    node: AZMpNode,
    workingMemoryElement:
      AZWorkingMemoryElement,
    matchSet: AZMatchSet,
  ): readonly AZToken[] {
    if (node.nodeId === null) {
      throw new Error(
        'AZ RETE MP-right activation requires a nodeId',
      )
    }

    if (
      this.linkManager
        .isMpLeftUnlinked(node)
    ) {
      this.linkManager
        .linkMpLeft(node)

      if (node.tokens.length === 0) {
        this.linkManager.unlinkRight(node)
        return []
      }
    }

    const hashValue =
      node.type === 'MP'
        ? node.nodeId ^
          workingMemoryElement.identifier.hashId
        : node.nodeId

    const matchedTokens: AZToken[] = []

    for (
      const token of
      this.hashIndex.getLeftBucket(hashValue)
    ) {
      if (token.node !== node) {
        continue
      }

      if (
        node.type === 'MP' &&
        token.hashReferent !==
          workingMemoryElement.identifier
      ) {
        continue
      }

      if (
        !this.testMatcher.matchesAll(
          node.tests,
          token,
          workingMemoryElement,
        )
      ) {
        continue
      }

      matchedTokens.push(token)

      for (const child of node.children) {
        this.activateChildLeft(
          child as AZReteNode,
          token,
          workingMemoryElement,
          matchSet,
        )
      }
    }

    return matchedTokens
  }

  public activateNegativeLeft(
    node: AZNegativeNode,
    parentToken: AZToken | null,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken {
    if (node.nodeId === null) {
      throw new Error(
        'AZ RETE negative node requires a nodeId',
      )
    }

    if (
      this.linkManager.isRightUnlinked(node)
    ) {
      this.linkManager.linkRight(node)
    }

    let hashReferent = null
    let hashValue = node.nodeId

    if (node.type === 'NEGATIVE') {
      if (
        node.leftHashFieldNumber === null ||
        node.leftHashLevelsUp === null
      ) {
        throw new Error(
          'AZ RETE hashed negative node requires a hash location',
        )
      }

      hashReferent =
        this.hashReferentResolver.resolve(
          parentToken,
          workingMemoryElement,
          {
            levelsUp: node.leftHashLevelsUp,
            fieldNumber:
              node.leftHashFieldNumber,
          },
        )

      hashValue =
        node.nodeId ^ hashReferent.hashId
    }

    const token: AZToken = {
      parent: parentToken,
      workingMemoryElement,
      node,
      hashReferent,
      negativeMatches: [],
      children: [],
    }

    node.tokens.push(token)

    if (parentToken !== null) {
      parentToken.children.push(token)
    }

    this.hashIndex.insertLeft(
      token,
      hashValue,
    )

    let rightMemories

    if (node.type === 'NEGATIVE') {
      if (hashReferent === null) {
        throw new Error(
          'AZ RETE hashed negative activation requires a hash referent',
        )
      }

      rightMemories =
        this.hashIndex
          .getRightBucket(
            node.alphaMemory.id ^
              hashReferent.hashId,
          )
          .filter(
            (rightMemory) =>
              rightMemory.alphaMemoryId ===
                node.alphaMemory.id &&
              rightMemory
                .workingMemoryElement
                .identifier === hashReferent,
          )
    } else {
      rightMemories =
        node.alphaMemory.getRightMemories()
    }

    for (const rightMemory of rightMemories) {
      const element =
        rightMemory.workingMemoryElement

      if (
        !this.testMatcher.matchesAll(
          node.tests,
          token,
          element,
        )
      ) {
        continue
      }

      token.negativeMatches.push({
        leftToken: token,
        workingMemoryElement: element,
        node,
      })
    }

    if (token.negativeMatches.length === 0) {
      for (const child of node.children) {
        this.activateChildLeft(
          child as AZReteNode,
          token,
          null,
          matchSet,
        )
      }
    }

    return token
  }

  public activateNegativeRight(
    node: AZNegativeNode,
    workingMemoryElement:
      AZWorkingMemoryElement,
    matchSet: AZMatchSet,
  ): readonly AZToken[] {
    if (node.nodeId === null) {
      throw new Error(
        'AZ RETE negative-right activation requires a nodeId',
      )
    }

    const hashValue =
      node.type === 'NEGATIVE'
        ? node.nodeId ^
          workingMemoryElement.identifier.hashId
        : node.nodeId

    const matchedTokens: AZToken[] = []

    for (
      const token of
      [...this.hashIndex.getLeftBucket(hashValue)]
    ) {
      if (token.node !== node) {
        continue
      }

      if (
        node.type === 'NEGATIVE' &&
        token.hashReferent !==
          workingMemoryElement.identifier
      ) {
        continue
      }

      if (
        !this.testMatcher.matchesAll(
          node.tests,
          token,
          workingMemoryElement,
        )
      ) {
        continue
      }

      token.negativeMatches.push({
        leftToken: token,
        workingMemoryElement,
        node,
      })

      matchedTokens.push(token)

      while (token.children.length > 0) {
        this.tokenRemovalManager
          .removeTokenAndSubtree(
            token.children[0]!,
            matchSet,
          )
      }
    }

    return matchedTokens
  }

  public activateCnLeft(
    node: AZCnNode,
    parentToken: AZToken | null,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken {
    if (node.type !== 'CN') {
      throw new Error(
        'AZ RETE CN-left activation requires a CN node',
      )
    }

    if (node.nodeId === null) {
      throw new Error(
        'AZ RETE CN-left activation requires a nodeId',
      )
    }

    const parentIdentity =
      parentToken === null
        ? 0
        : this.tokenIdentityManager
            .getIdentity(parentToken)

    const timetag =
      workingMemoryElement?.timetag ?? 0

    const hashValue =
      node.nodeId ^
      parentIdentity ^
      timetag

    const existingToken =
      this.hashIndex
        .getLeftBucket(hashValue)
        .find(
          (candidate) =>
            candidate.node === node &&
            candidate.parent === parentToken &&
            candidate.workingMemoryElement ===
              workingMemoryElement,
        )

    if (existingToken !== undefined) {
      return existingToken
    }

    const token = {
      parent: parentToken,
      workingMemoryElement,
      node,
      hashReferent: null,
      negativeMatches: [],
      children: [],
      cnPartnerTokens: [],
    }

    node.tokens.push(token)

    if (parentToken !== null) {
      parentToken.children.push(token)
    }

    this.hashIndex.insertLeft(
      token,
      hashValue,
    )

    for (const child of node.children) {
      this.activateChildLeft(
        child as AZReteNode,
        token,
        null,
        matchSet,
      )
    }

    return token
  }

  public activateCnPartnerLeft(
    node: AZCnNode,
    parentToken: AZToken,
    workingMemoryElement:
      AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken {
    if (node.type !== 'CN_PARTNER') {
      throw new Error(
        'AZ RETE CN partner left activation requires a CN_PARTNER node',
      )
    }

    const partner = node.partner

    if (
      partner === null ||
      partner.type !== 'CN'
    ) {
      throw new Error(
        'AZ RETE CN_PARTNER requires its CN partner',
      )
    }

    if (partner.nodeId === null) {
      throw new Error(
        'AZ RETE CN partner node requires a nodeId',
      )
    }

    let currentToken: AZToken | null =
      parentToken

    let currentWme:
      AZWorkingMemoryElement | null =
      workingMemoryElement

    let currentNode: AZReteNode | null =
      node.parent as AZReteNode | null

    while (currentNode !== partner.parent) {
      if (currentNode === null) {
        throw new Error(
          'AZ RETE CN_PARTNER branch does not reach CN parent',
        )
      }

      if (currentToken === null) {
        throw new Error(
          'AZ RETE CN_PARTNER token ancestry ended before CN parent',
        )
      }

      currentNode =
        this.reteParentResolver
          .getRealParent(currentNode) as
          AZReteNode | null

      currentWme =
        currentToken.workingMemoryElement

      currentToken =
        currentToken.parent
    }

    if (currentToken === null) {
      throw new Error(
        'AZ RETE CN token requires a parent token',
      )
    }

    const hashValue =
      partner.nodeId ^
      this.tokenIdentityManager
        .getIdentity(currentToken) ^
      (currentWme?.timetag ?? 0)

    let leftToken: AZCnToken | null = null

    for (
      const existing
      of this.hashIndex.getLeftBucket(
        hashValue,
      )
    ) {
      if (
        existing.node !== partner ||
        existing.parent !== currentToken ||
        existing.workingMemoryElement !==
          currentWme
      ) {
        continue
      }

      if (!('cnPartnerTokens' in existing)) {
        throw new Error(
          'AZ RETE existing CN token has invalid structure',
        )
      }

      leftToken = existing as AZCnToken
      break
    }

    if (leftToken === null) {
      leftToken = {
        parent: currentToken,
        workingMemoryElement: currentWme,
        node: partner,
        hashReferent: null,
        negativeMatches: [],
        cnPartnerTokens: [],
        children: [],
      }

      partner.tokens.push(leftToken)
      currentToken.children.push(leftToken)

      this.hashIndex.insertLeft(
        leftToken,
        hashValue,
      )
    }

    const cnPartnerToken:
      AZCnPartnerToken = {
        parent: parentToken,
        workingMemoryElement,
        node,
        hashReferent: null,
        negativeMatches: [],
        children: [],
        leftToken,
      }

    node.tokens.push(cnPartnerToken)
    parentToken.children.push(
      cnPartnerToken,
    )

    leftToken.cnPartnerTokens.unshift(
      cnPartnerToken,
    )

    while (leftToken.children.length > 0) {
      const child =
        leftToken.children[0]

      if (child === undefined) {
        break
      }

      this.tokenRemovalManager
        .removeTokenAndSubtree(
          child,
          matchSet,
        )
    }

    return cnPartnerToken
  }
}
