import type { Condition } from './Condition'

export interface Goal<TSituation = unknown> {
  readonly condition: Condition<TSituation>
}
