import type { AZToken } from './AZToken'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZReteFieldNumber } from './AZVariableLocation'

export interface AZMemoryNode extends AZReteNodeBase {
  readonly type: 'MEMORY' | 'UNHASHED_MEMORY'
  readonly leftHashFieldNumber: AZReteFieldNumber | null
  readonly leftHashLevelsUp: number | null
  tokens: AZToken[]
}
