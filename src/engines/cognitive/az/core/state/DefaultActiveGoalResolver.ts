import type {
  ActiveGoalMatchSet,
  ActiveGoalPhase,
  ActiveGoalResolver,
} from './ActiveGoalResolver'

export class DefaultActiveGoalResolver
  implements ActiveGoalResolver
{
  public resolve<
    TGoal,
    TContext extends {
      readonly goal: TGoal
      lower: TContext | null
    },
  >(
    start: TContext | null,
    phase: ActiveGoalPhase,
    matchSet:
      ActiveGoalMatchSet<NoInfer<TGoal>>,
    noneOk: boolean,
  ): TContext | null {
    let current = start

    while (current !== null) {
      const goal =
        current.goal

      const hasIAssertion =
        matchSet.hasAssertion(
          'I_ASSERTION',
          goal,
        )

      const hasRetraction =
        matchSet.hasRetraction(goal)

      if (
        phase === 'PROPOSE' &&
        (
          hasIAssertion ||
          hasRetraction
        )
      ) {
        return current
      }

      if (phase === 'APPLY') {
        const hasOAssertion =
          matchSet.hasAssertion(
            'O_ASSERTION',
            goal,
          )

        if (
          hasIAssertion ||
          hasOAssertion ||
          hasRetraction
        ) {
          return current
        }
      }

      current = current.lower
    }

    if (!noneOk) {
      throw new Error(
        'Unable to find an active goal when not at quiescence',
      )
    }

    return null
  }
}
