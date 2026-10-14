import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZRhsFunction } from './AZRhsFunction'

export class AZRhsFunctionRegistry {
  private readonly functions =
    new Map<AZSymbol, AZRhsFunction>()

  public register(
    name: AZSymbol,
    function_: AZRhsFunction,
  ): void {
    this.functions.set(name, function_)
  }

  public lookup(
    name: AZSymbol,
  ): AZRhsFunction | null {
    return this.functions.get(name) ?? null
  }
}
