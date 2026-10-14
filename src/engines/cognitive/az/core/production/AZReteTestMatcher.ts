import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZReteTest } from './AZReteTest'
import type { AZToken } from './AZToken'

export interface AZReteTestMatcher {
  matches(
    test: AZReteTest,
    leftToken: AZToken,
    rightWme: AZWorkingMemoryElement,
  ): boolean

  matchesAll(
    tests: readonly AZReteTest[],
    leftToken: AZToken,
    rightWme: AZWorkingMemoryElement,
  ): boolean
}
