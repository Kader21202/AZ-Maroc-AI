import type { AZAlphaMemory } from './AZAlphaMemory'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZReteTest } from './AZReteTest'
import type { AZToken } from './AZToken'
import type { AZReteFieldNumber } from './AZVariableLocation'

export interface AZMpNode extends AZReteNodeBase {
  readonly type: 'MP' | 'UNHASHED_MP'
  readonly leftHashFieldNumber: AZReteFieldNumber | null
  readonly leftHashLevelsUp: number | null
  alphaMemory: AZAlphaMemory
  tests: readonly AZReteTest[]
  tokens: AZToken[]
  leftUnlinked: boolean
  rightUnlinked: boolean
}
