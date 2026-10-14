import type { AZMpNode } from './AZMpNode'
import type { AZNegativeNode } from './AZNegativeNode'
import type { AZPositiveNode } from './AZPositiveNode'

export type AZRightLinkedReteNodeType =
  | 'POSITIVE'
  | 'UNHASHED_POSITIVE'
  | 'MP'
  | 'UNHASHED_MP'
  | 'NEGATIVE'
  | 'UNHASHED_NEGATIVE'

export type AZRightLinkedReteNode =
  | AZPositiveNode
  | AZMpNode
  | AZNegativeNode
