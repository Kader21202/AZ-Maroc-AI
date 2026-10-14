import type { AZProductionTest } from './AZProductionTest'

export function findAZEqualityTest(
  test: AZProductionTest,
): AZProductionTest | null {
  if (test.type === 'EQUALITY') {
    return test
  }

  if (test.type === 'CONJUNCTIVE') {
    for (const conjunct of test.conjuncts ?? []) {
      if (conjunct.type === 'EQUALITY') {
        return conjunct
      }
    }
  }

  return null
}
