import type { AZReteNodeBase } from './AZReteNodeBase'

export interface AZDummyMatchesNode extends AZReteNodeBase {
  readonly type: 'DUMMY_MATCHES'
}
