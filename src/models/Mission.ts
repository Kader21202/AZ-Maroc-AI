import type { WorkingState } from './WorkingState'

export type MissionStatus =
  | 'CREATED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export interface Mission<TSituation = unknown> {
  readonly id: string
  readonly request: unknown
  status: MissionStatus
  workingState: WorkingState<TSituation>
  result: unknown | null
}
