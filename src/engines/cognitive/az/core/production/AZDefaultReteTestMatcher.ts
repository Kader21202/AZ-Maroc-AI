import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import { AZDefaultReteLocationResolver } from './AZDefaultReteLocationResolver'
import type { AZReteLocationResolver } from './AZReteLocationResolver'
import type { AZReteTest } from './AZReteTest'
import type { AZReteTestMatcher } from './AZReteTestMatcher'
import type { AZReteRelationalType } from './AZReteTestType'
import type { AZToken } from './AZToken'
import type { AZGoalStateResolver } from './AZGoalStateResolver'
import { getAZReteWmeField } from './AZReteWmeField'

export class AZDefaultReteTestMatcher
  implements AZReteTestMatcher
{
  public constructor(
    private readonly locationResolver: AZReteLocationResolver =
      new AZDefaultReteLocationResolver(),
    private readonly goalStateResolver?: AZGoalStateResolver,
  ) {}

  public matches(
    test: AZReteTest,
    leftToken: AZToken,
    rightWme: AZWorkingMemoryElement,
  ): boolean {
    const right =
      getAZReteWmeField(
        rightWme,
        test.rightFieldNumber,
      )

    switch (test.type) {
      case 'DISJUNCTION':
        return (
          test.data.kind === 'DISJUNCTION' &&
          test.data.symbols.includes(right)
        )

      case 'CONSTANT_RELATIONAL':
        if (
          test.data.kind !== 'CONSTANT' ||
          test.relationalType === undefined
        ) {
          return false
        }

        return this.evaluateRelation(
          right,
          test.data.symbol,
          test.relationalType,
        )

      case 'VARIABLE_RELATIONAL':
        if (
          test.data.kind !== 'VARIABLE' ||
          test.relationalType === undefined
        ) {
          return false
        }

        return this.evaluateRelation(
          right,
          this.locationResolver.resolve(
            leftToken,
            rightWme,
            test.data.location.levelsUp,
            test.data.location.fieldNumber,
          ),
          test.relationalType,
        )

      case 'ID_IS_GOAL':
        return (
          right.type === 'IDENTIFIER' &&
          this.goalStateResolver?.isGoal(right) === true
        )

      case 'ID_IS_IMPASSE':
      case 'UNARY_SMEM_LINK':
      case 'UNARY_SMEM_LINK_NOT':
        return false
    }
  }

  public matchesAll(
    tests: readonly AZReteTest[],
    leftToken: AZToken,
    rightWme: AZWorkingMemoryElement,
  ): boolean {
    return tests.every((test) =>
      this.matches(
        test,
        leftToken,
        rightWme,
      ),
    )
  }

  private evaluateRelation(
    left: AZSymbol,
    right: AZSymbol,
    relation: AZReteRelationalType,
  ): boolean {
    switch (relation) {
      case 'EQUAL':
        return left === right

      case 'NOT_EQUAL':
        return left !== right

      case 'LESS':
        return this.compare(left, right) < 0

      case 'GREATER':
        return this.compare(left, right) > 0

      case 'LESS_OR_EQUAL':
        return this.compare(left, right) <= 0

      case 'GREATER_OR_EQUAL':
        return this.compare(left, right) >= 0

      case 'SAME_TYPE':
        return left.type === right.type

      case 'SMEM_LINK':
      case 'SMEM_LINK_NOT':
      case 'CONSTANT_MATCH':
        return false
    }
  }

  private compare(
    left: AZSymbol,
    right: AZSymbol,
  ): number {
    const leftNumeric =
      left.type === 'INTEGER_CONSTANT' ||
      left.type === 'FLOAT_CONSTANT'

    const rightNumeric =
      right.type === 'INTEGER_CONSTANT' ||
      right.type === 'FLOAT_CONSTANT'

    if (
      leftNumeric &&
      rightNumeric &&
      typeof left.value === 'number' &&
      typeof right.value === 'number'
    ) {
      return left.value < right.value
        ? -1
        : left.value > right.value
          ? 1
          : 0
    }

    const comparableTypes =
      left.type === right.type &&
      (
        left.type === 'STRING_CONSTANT' ||
        left.type === 'IDENTIFIER'
      )

    if (
      comparableTypes &&
      typeof left.value === 'string' &&
      typeof right.value === 'string'
    ) {
      return left.value < right.value
        ? -1
        : left.value > right.value
          ? 1
          : 0
    }

    return -1
  }
}
