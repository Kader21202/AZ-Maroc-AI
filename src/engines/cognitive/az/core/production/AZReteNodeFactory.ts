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
import type { AZReteTest } from './AZReteTest'
import type { AZVariableLocation } from './AZVariableLocation'

export interface AZReteNodeFactory {
  createDummyTopNode(): AZDummyTopNode

  createMemoryNode(
    parent: AZReteNode,
    hashed: boolean,
    leftHashLocation: AZVariableLocation,
    preservedNodeId?: number,
  ): AZMemoryNode

  createPositiveNode(
    parent: AZReteNode,
    hashed: boolean,
    alphaMemory: AZAlphaMemory,
    tests: readonly AZReteTest[],
  ): AZPositiveNode

  createMpNode(
    parent: AZReteNode,
    hashed: boolean,
    leftHashLocation: AZVariableLocation,
    alphaMemory: AZAlphaMemory,
    tests: readonly AZReteTest[],
    preservedNodeId?: number,
  ): AZMpNode

  createNegativeNode(
    parent: AZReteNode,
    hashed: boolean,
    leftHashLocation: AZVariableLocation,
    alphaMemory: AZAlphaMemory,
    tests: readonly AZReteTest[],
  ): AZNegativeNode

  createCnNodes(
    parent: AZReteNode,
    bottomOfSubconditions: AZReteNode,
  ): {
    readonly node: AZCnNode
    readonly partner: AZCnNode
  }

  createProductionNode(
    parent: AZReteNode,
    production: AZProduction,
  ): AZProductionNode
}
