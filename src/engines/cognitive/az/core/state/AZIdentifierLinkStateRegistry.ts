import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZIdentifierLinkState {
  linkCount: number
  level: number
  promotionLevel: number
  couldBeALinkFromBelow: boolean
}

export interface AZIdentifierLinkStateRegistry {
  has(symbol: AZSymbol): boolean

  get(symbol: AZSymbol): AZIdentifierLinkState

  register(
    symbol: AZSymbol,
    initial?: Partial<AZIdentifierLinkState>,
  ): AZIdentifierLinkState

  remove(symbol: AZSymbol): void
}
