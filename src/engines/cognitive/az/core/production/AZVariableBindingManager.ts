import type { AZProductionTest } from './AZProductionTest'
import type { AZSymbol } from '../symbols/AZSymbol'
import type {
  AZReteFieldNumber,
  AZVariableLocation,
} from './AZVariableLocation'

export interface AZVariableBindingManager {
  isBound(variable: AZSymbol): boolean

  pushBinding(
    variable: AZSymbol,
    depth: number,
    fieldNumber: AZReteFieldNumber,
  ): void

  popBinding(variable: AZSymbol): void

  findLocation(
    variable: AZSymbol,
    currentDepth: number,
  ): AZVariableLocation | null

  bindVariablesInTest(
    test: AZProductionTest,
    depth: number,
    fieldNumber: AZReteFieldNumber,
    dense: boolean,
  ): readonly AZSymbol[]

  popBindings(
    variables: readonly AZSymbol[],
  ): void
}
