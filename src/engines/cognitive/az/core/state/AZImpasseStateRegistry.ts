import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZImpasseStateRegistry {
  isImpasse(symbol: AZSymbol): boolean

  registerImpasse(
    symbol: AZSymbol,
  ): void

  removeImpasse(
    symbol: AZSymbol,
  ): void
}
