import type { AZProduction } from './AZProduction'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZToken } from './AZToken'

export interface AZProductionNode extends AZReteNodeBase {
  readonly type: 'PRODUCTION'
  readonly production: AZProduction
  tokens: AZToken[]
}
