import type { AZToken } from './AZToken'

export interface AZCnToken extends AZToken {
  cnPartnerTokens: AZCnPartnerToken[]
}

export interface AZCnPartnerToken extends AZToken {
  readonly leftToken: AZCnToken
}
