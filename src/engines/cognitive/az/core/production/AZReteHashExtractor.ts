import type { AZReteTest } from './AZReteTest'
import type { AZVariableLocation } from './AZVariableLocation'

export interface AZReteHashExtractionResult {
  readonly hashed: boolean
  readonly leftHashLocation: AZVariableLocation
  readonly remainingTests: readonly AZReteTest[]
}

export interface AZReteHashExtractor {
  extract(
    tests: readonly AZReteTest[],
  ): AZReteHashExtractionResult
}

export class AZDefaultReteHashExtractor
  implements AZReteHashExtractor
{
  public extract(
    tests: readonly AZReteTest[],
  ): AZReteHashExtractionResult {
    const index = tests.findIndex(
      (test) =>
        test.type === 'VARIABLE_RELATIONAL' &&
        test.relationalType === 'EQUAL' &&
        test.data.kind === 'VARIABLE',
    )

    if (index < 0) {
      return {
        hashed: false,
        leftHashLocation: {
          levelsUp: 0,
          fieldNumber: 0,
        },
        remainingTests: tests,
      }
    }

    const hashTest = tests[index]!

    if (hashTest.data.kind !== 'VARIABLE') {
      throw new Error(
        'AZ RETE hash test must contain a variable location',
      )
    }

    return {
      hashed: true,
      leftHashLocation: hashTest.data.location,
      remainingTests: [
        ...tests.slice(0, index),
        ...tests.slice(index + 1),
      ],
    }
  }
}
