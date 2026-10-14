import type { Mission } from '../../models/Mission'

export interface ICognitiveEngine {
  process(mission: Mission): Promise<Mission>
}
