import type { AZProductionTest } from './AZProductionTest'
import type { AZReteTest } from './AZReteTest'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZReteFieldNumber } from './AZVariableLocation'

export interface AZReteTestBuildResult {
  readonly tests: readonly AZReteTest[]
  readonly alphaConstant: AZSymbol | null
}

export interface AZReteTestBuilder {
  buildForTest(
    test: AZProductionTest,
    currentDepth: number,
    fieldNumber: AZReteFieldNumber,
    existingTests: readonly AZReteTest[],
    alphaConstant: AZSymbol | null,
  ): AZReteTestBuildResult
}
