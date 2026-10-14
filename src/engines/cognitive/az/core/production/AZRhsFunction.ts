import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZRhsFunction {
  readonly canBeRhsValue: boolean
  readonly canBeStandaloneAction: boolean
  readonly numArgsExpected: number

  execute(
    arguments_: readonly AZSymbol[],
  ): AZSymbol | null
}
