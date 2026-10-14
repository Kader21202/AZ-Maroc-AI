export type ActiveGoalPhase =
  | 'PROPOSE'
  | 'APPLY'

export interface ActiveGoalMatchSet<TGoal> {
  hasAssertion(
    type: 'I_ASSERTION' | 'O_ASSERTION',
    goal: TGoal,
  ): boolean

  hasRetraction(
    goal: TGoal,
  ): boolean
}

export interface ActiveGoalResolver {
  resolve<
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
  ): TContext | null
}
