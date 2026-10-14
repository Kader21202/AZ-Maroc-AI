export type AZReteFieldNumber = 0 | 1 | 2

export interface AZVariableLocation {
  readonly levelsUp: number
  readonly fieldNumber: AZReteFieldNumber
}
