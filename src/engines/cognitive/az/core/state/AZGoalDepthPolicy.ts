export interface AZGoalDepthPolicy {
  isAllowed(level: number): boolean
}

export class AZBoundedGoalDepthPolicy
  implements AZGoalDepthPolicy
{
  public constructor(
    private readonly maxGoalDepth: number,
  ) {
    if (
      !Number.isInteger(maxGoalDepth) ||
      maxGoalDepth < 1
    ) {
      throw new Error(
        'AZ maximum goal depth must be a positive integer.',
      )
    }
  }

  public isAllowed(level: number): boolean {
    return level <= this.maxGoalDepth
  }
}
