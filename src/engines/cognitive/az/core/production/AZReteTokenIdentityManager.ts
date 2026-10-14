import type { AZToken } from './AZToken'

export interface AZReteTokenIdentityManager {
  getIdentity(token: AZToken): number
}
