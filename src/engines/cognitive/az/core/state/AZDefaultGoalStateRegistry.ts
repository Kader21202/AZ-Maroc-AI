import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalStateRegistry } from './AZGoalStateRegistry'

export class AZDefaultGoalStateRegistry
  implements AZGoalStateRegistry
{
  private readonly levels =
    new Map<AZSymbol, number>()

  public isGoal(symbol: AZSymbol): boolean {
    return this.levels.has(symbol)
  }

  public getLevel(symbol: AZSymbol): number {
    const level = this.levels.get(symbol)

    if (level === undefined) {
      throw new Error(
        'Goal state is not registered',
      )
    }

    return level
  }

  public registerGoal(
    symbol: AZSymbol,
    level: number,
  ): void {
    this.levels.set(symbol, level)
  }

  public removeGoal(symbol: AZSymbol): void {
    this.levels.delete(symbol)
  }
}
