import type { Mission } from '../models/Mission'

export interface IOrchestrator {
  execute(mission: Mission): Promise<Mission>
}
