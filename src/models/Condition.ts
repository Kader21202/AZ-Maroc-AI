export type ConditionResult =
  | 'SATISFIED'
  | 'UNSATISFIED'
  | 'UNKNOWN'

export interface Condition<TSituation = unknown> {
  evaluate(
    situation: TSituation
  ): ConditionResult
}
