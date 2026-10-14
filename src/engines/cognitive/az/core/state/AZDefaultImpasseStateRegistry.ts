import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZImpasseStateRegistry } from './AZImpasseStateRegistry'

export class AZDefaultImpasseStateRegistry
  implements AZImpasseStateRegistry
{
  private readonly impasses =
    new Set<AZSymbol>()

  public isImpasse(
    symbol: AZSymbol,
  ): boolean {
    return this.impasses.has(symbol)
  }

  public registerImpasse(
    symbol: AZSymbol,
  ): void {
    this.impasses.add(symbol)
  }

  public removeImpasse(
    symbol: AZSymbol,
  ): void {
    this.impasses.delete(symbol)
  }
}
