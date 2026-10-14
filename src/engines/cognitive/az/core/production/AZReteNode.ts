import type { AZMemoryNode } from './AZMemoryNode'
import type { AZPositiveNode } from './AZPositiveNode'
import type { AZNegativeNode } from './AZNegativeNode'
import type { AZMpNode } from './AZMpNode'
import type { AZCnNode } from './AZCnNode'
import type { AZProductionNode } from './AZProductionNode'
import type { AZDummyTopNode } from './AZDummyTopNode'
import type { AZDummyMatchesNode } from './AZDummyMatchesNode'

export type AZReteNode =
  | AZMemoryNode
  | AZPositiveNode
  | AZNegativeNode
  | AZMpNode
  | AZCnNode
  | AZProductionNode
  | AZDummyTopNode
  | AZDummyMatchesNode
