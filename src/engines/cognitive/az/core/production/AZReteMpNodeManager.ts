import type { AZMemoryNode } from './AZMemoryNode'
import type { AZMpNode } from './AZMpNode'

export interface AZReteMpNodeManager {
  splitMpNode(
    mpNode: AZMpNode,
  ): AZMemoryNode

  mergeIntoMpNode(
    memoryNode: AZMemoryNode,
  ): AZMpNode
}
