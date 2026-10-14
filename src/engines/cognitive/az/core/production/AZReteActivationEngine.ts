import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZAlphaMemory } from './AZAlphaMemory'
import type { AZCnNode } from './AZCnNode'
import type { AZMatchSet } from './AZMatchSet'
import type { AZMemoryNode } from './AZMemoryNode'
import type { AZMpNode } from './AZMpNode'
import type { AZNegativeNode } from './AZNegativeNode'
import type { AZPositiveNode } from './AZPositiveNode'
import type { AZReteNode } from './AZReteNode'
import type { AZToken } from './AZToken'

export interface AZReteActivationEngine {
  updateNodeWithMatchesFromAbove(
    child: AZReteNode,
    matchSet: AZMatchSet,
  ): void


  removeWorkingMemoryElement(
    element: AZWorkingMemoryElement,
    affectedAlphaMemories: readonly AZAlphaMemory[],
    matchSet: AZMatchSet,
  ): void

  activateMemoryLeft(
    node: AZMemoryNode,
    parentToken: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken

  activatePositiveLeft(
    node: AZPositiveNode,
    token: AZToken,
    matchSet: AZMatchSet,
  ): readonly AZWorkingMemoryElement[]

  activatePositiveRight(
    node: AZPositiveNode,
    workingMemoryElement: AZWorkingMemoryElement,
    matchSet: AZMatchSet,
  ): readonly AZToken[]

  activateMpLeft(
    node: AZMpNode,
    parentToken: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken

  activateMpRight(
    node: AZMpNode,
    workingMemoryElement: AZWorkingMemoryElement,
    matchSet: AZMatchSet,
  ): readonly AZToken[]

  activateNegativeLeft(
    node: AZNegativeNode,
    parentToken: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken

  activateNegativeRight(
    node: AZNegativeNode,
    workingMemoryElement: AZWorkingMemoryElement,
    matchSet: AZMatchSet,
  ): readonly AZToken[]

  activateCnLeft(
    node: AZCnNode,
    parentToken: AZToken | null,
    workingMemoryElement: AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken

  activateCnPartnerLeft(
    node: AZCnNode,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
    matchSet: AZMatchSet,
  ): AZToken
}
