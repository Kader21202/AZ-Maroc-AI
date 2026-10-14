import type { Mission } from '../../../models/Mission'

export interface IInterpreter {
  interpret(mission: Mission): Promise<Mission>
}
