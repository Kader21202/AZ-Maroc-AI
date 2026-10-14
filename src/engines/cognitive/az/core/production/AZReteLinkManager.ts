import type { AZMpNode } from './AZMpNode'
import type { AZNegativeNode } from './AZNegativeNode'
import type { AZPositiveNode } from './AZPositiveNode'

export interface AZReteLinkManager {
  isRightUnlinked(
    node:
      | AZPositiveNode
      | AZMpNode
      | AZNegativeNode,
  ): boolean

  linkRight(
    node:
      | AZPositiveNode
      | AZMpNode
      | AZNegativeNode,
  ): void

  unlinkRight(
    node:
      | AZPositiveNode
      | AZMpNode
      | AZNegativeNode,
  ): void

  isPositiveLeftUnlinked(
    node: AZPositiveNode,
  ): boolean

  linkPositiveLeft(
    node: AZPositiveNode,
  ): void

  unlinkPositiveLeft(
    node: AZPositiveNode,
  ): void

  isMpLeftUnlinked(
    node: AZMpNode,
  ): boolean

  linkMpLeft(
    node: AZMpNode,
  ): void

  unlinkMpLeft(
    node: AZMpNode,
  ): void
}
