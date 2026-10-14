import type { AZSymbol } from '../symbols/AZSymbol'
import type {
  AZIdentifierLinkState,
  AZIdentifierLinkStateRegistry,
} from './AZIdentifierLinkStateRegistry'

export class AZDefaultIdentifierLinkStateRegistry
  implements AZIdentifierLinkStateRegistry
{
  private readonly states =
    new Map<AZSymbol, AZIdentifierLinkState>()

  public has(symbol: AZSymbol): boolean {
    return this.states.has(symbol)
  }

  public get(
    symbol: AZSymbol,
  ): AZIdentifierLinkState {
    const state = this.states.get(symbol)

    if (state === undefined) {
      throw new Error(
        'Identifier link state is not registered',
      )
    }

    return state
  }

  public register(
    symbol: AZSymbol,
    initial: Partial<AZIdentifierLinkState> = {},
  ): AZIdentifierLinkState {
    const existing =
      this.states.get(symbol)

    if (existing !== undefined) {
      return existing
    }

    const state: AZIdentifierLinkState = {
      linkCount: initial.linkCount ?? 0,
      level: initial.level ?? 0,
      promotionLevel:
        initial.promotionLevel ??
        initial.level ??
        0,
      couldBeALinkFromBelow:
        initial.couldBeALinkFromBelow ??
        false,
    }

    this.states.set(symbol, state)

    return state
  }

  public remove(symbol: AZSymbol): void {
    this.states.delete(symbol)
  }
}
