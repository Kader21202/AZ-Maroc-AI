import type { AZAlphaMemory } from './AZAlphaMemory'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZReteTest } from './AZReteTest'

export interface AZPositiveNode extends AZReteNodeBase {
  readonly type: 'POSITIVE' | 'UNHASHED_POSITIVE'
  alphaMemory: AZAlphaMemory
  tests: readonly AZReteTest[]
  leftUnlinked: boolean
  rightUnlinked: boolean
}
