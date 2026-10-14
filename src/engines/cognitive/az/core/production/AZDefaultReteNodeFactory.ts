import type { AZAlphaMemory } from './AZAlphaMemory'
import type { AZCnNode } from './AZCnNode'
import type { AZDummyTopNode } from './AZDummyTopNode'
import type { AZMemoryNode } from './AZMemoryNode'
import type { AZMpNode } from './AZMpNode'
import type { AZNegativeNode } from './AZNegativeNode'
import type { AZPositiveNode } from './AZPositiveNode'
import type { AZProduction } from './AZProduction'
import type { AZProductionNode } from './AZProductionNode'
import type { AZReteNode } from './AZReteNode'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZReteNodeFactory } from './AZReteNodeFactory'
import type { AZReteTest } from './AZReteTest'
import type { AZVariableLocation } from './AZVariableLocation'

export class AZDefaultReteNodeFactory
  implements AZReteNodeFactory
{
  private nextBetaNodeId = 0

  public createDummyTopNode(): AZDummyTopNode {
    return {
      type: 'DUMMY_TOP',
      nodeId: null,
      parent: null,
      children: [],
      tokens: [],
    }
  }

  public createMemoryNode(
    parent: AZReteNode,
    hashed: boolean,
    leftHashLocation: AZVariableLocation,
    preservedNodeId?: number,
  ): AZMemoryNode {
    const node: AZMemoryNode = {
      type: hashed ? 'MEMORY' : 'UNHASHED_MEMORY',
      nodeId:
        preservedNodeId ??
        this.getNextBetaNodeId(),
      parent,
      children: [],
      leftHashFieldNumber:
        leftHashLocation.fieldNumber,
      leftHashLevelsUp:
        leftHashLocation.levelsUp,
      tokens: [],
    }

    parent.children.unshift(node)

    return node
  }

  public createPositiveNode(
    parent: AZReteNode,
    hashed: boolean,
    alphaMemory: AZAlphaMemory,
    tests: readonly AZReteTest[],
  ): AZPositiveNode {
    const node: AZPositiveNode = {
      type:
        hashed
          ? 'POSITIVE'
          : 'UNHASHED_POSITIVE',
      nodeId: null,
      parent,
      children: [],
      alphaMemory,
      tests,
      leftUnlinked: false,
      rightUnlinked: false,
    }

    parent.children.unshift(node)
    alphaMemory.addBetaNode(node)

    return node
  }

  public createMpNode(
    parent: AZReteNode,
    hashed: boolean,
    leftHashLocation: AZVariableLocation,
    alphaMemory: AZAlphaMemory,
    tests: readonly AZReteTest[],
    preservedNodeId?: number,
  ): AZMpNode {
    const node: AZMpNode = {
      type: hashed ? 'MP' : 'UNHASHED_MP',
      nodeId:
        preservedNodeId ??
        this.getNextBetaNodeId(),
      parent,
      children: [],
      leftHashFieldNumber:
        leftHashLocation.fieldNumber,
      leftHashLevelsUp:
        leftHashLocation.levelsUp,
      alphaMemory,
      tests,
      tokens: [],
      leftUnlinked: false,
      rightUnlinked: false,
    }

    parent.children.unshift(node)
    alphaMemory.addBetaNode(node)

    return node
  }

  public createNegativeNode(
    parent: AZReteNode,
    hashed: boolean,
    leftHashLocation: AZVariableLocation,
    alphaMemory: AZAlphaMemory,
    tests: readonly AZReteTest[],
  ): AZNegativeNode {
    const node: AZNegativeNode = {
      type:
        hashed
          ? 'NEGATIVE'
          : 'UNHASHED_NEGATIVE',
      nodeId: this.getNextBetaNodeId(),
      parent,
      children: [],
      leftHashFieldNumber:
        leftHashLocation.fieldNumber,
      leftHashLevelsUp:
        leftHashLocation.levelsUp,
      alphaMemory,
      tests,
      tokens: [],
      rightUnlinked: false,
    }

    parent.children.unshift(node)
    alphaMemory.addBetaNode(node)

    return node
  }

  public createCnNodes(
    parent: AZReteNode,
    bottomOfSubconditions: AZReteNode,
  ): {
    readonly node: AZCnNode
    readonly partner: AZCnNode
  } {
    let topOfSubconditions: AZReteNodeBase =
      bottomOfSubconditions

    while (
      topOfSubconditions.parent !== null &&
      topOfSubconditions.parent !== parent
    ) {
      topOfSubconditions =
        topOfSubconditions.parent
    }

    if (
      topOfSubconditions.parent !== parent
    ) {
      throw new Error(
        'Bottom of CN subconditions must descend from parent',
      )
    }

    const node: AZCnNode = {
      type: 'CN',
      nodeId: this.getNextBetaNodeId(),
      parent,
      children: [],
      partner: null,
      tokens: [],
    }

    const partner: AZCnNode = {
      type: 'CN_PARTNER',
      nodeId: null,
      parent: bottomOfSubconditions,
      children: [],
      partner: node,
      tokens: [],
    }

    node.partner = partner

    const topIndex =
      parent.children.indexOf(
        topOfSubconditions,
      )

    if (topIndex < 0) {
      throw new Error(
        'Top of CN subconditions must be a child of parent',
      )
    }

    parent.children.splice(topIndex, 1)
    parent.children.unshift(
      topOfSubconditions,
      node,
    )

    bottomOfSubconditions.children.unshift(
      partner,
    )

    return { node, partner }
  }

  public createProductionNode(
    parent: AZReteNode,
    production: AZProduction,
  ): AZProductionNode {
    const node: AZProductionNode = {
      type: 'PRODUCTION',
      nodeId: null,
      parent,
      children: [],
      production,
      tokens: [],
    }

    parent.children.unshift(node)

    production.productionNode = node

    return node
  }

  private getNextBetaNodeId(): number {
    const nodeId = this.nextBetaNodeId
    this.nextBetaNodeId += 1
    return nodeId
  }
}
