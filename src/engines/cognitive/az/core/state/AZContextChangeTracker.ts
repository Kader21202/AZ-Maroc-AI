import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalStateRegistry } from './AZGoalStateRegistry'

export class AZContextChangeTracker {
  private highestChangedGoal:
    AZSymbol | null = null

  public constructor(
    private readonly goalStateRegistry:
      AZGoalStateRegistry,
  ) {}

  public get highestGoalWhoseContextChanged():
    AZSymbol | null {
    return this.highestChangedGoal
  }

  public markGoalAsContextChanged(
    goal: AZSymbol,
  ): void {
    if (!this.goalStateRegistry.isGoal(goal)) {
      throw new Error(
        'Context change requires a registered goal',
      )
    }

    const current =
      this.highestChangedGoal

    if (current === null) {
      this.highestChangedGoal = goal
      return
    }

    const changedLevel =
      this.goalStateRegistry.getLevel(goal)

    const currentLevel =
      this.goalStateRegistry.getLevel(current)

    if (changedLevel < currentLevel) {
      this.highestChangedGoal = goal
    }
  }

  public clear(): void {
    this.highestChangedGoal = null
  }
}
