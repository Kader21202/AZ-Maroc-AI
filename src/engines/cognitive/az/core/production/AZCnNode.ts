import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZToken } from './AZToken'

export interface AZCnNode extends AZReteNodeBase {
  readonly type: 'CN' | 'CN_PARTNER'
  partner: AZCnNode | null
  tokens: AZToken[]
}
