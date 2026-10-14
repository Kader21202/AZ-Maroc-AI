import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZToken } from './AZToken'

export interface AZDummyTopNode extends AZReteNodeBase {
  readonly type: 'DUMMY_TOP'
  tokens: AZToken[]
}
