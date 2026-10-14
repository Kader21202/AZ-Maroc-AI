import type { AZReteTokenIdentityManager } from './AZReteTokenIdentityManager'
import type { AZToken } from './AZToken'

export class AZDefaultReteTokenIdentityManager
  implements AZReteTokenIdentityManager
{
  private readonly identities =
    new WeakMap<AZToken, number>()

  private nextIdentity = 1

  public getIdentity(
    token: AZToken,
  ): number {
    const existing =
      this.identities.get(token)

    if (existing !== undefined) {
      return existing
    }

    const identity =
      this.nextIdentity

    this.nextIdentity += 1

    this.identities.set(
      token,
      identity,
    )

    return identity
  }
}
