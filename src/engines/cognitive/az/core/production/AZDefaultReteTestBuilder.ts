import type { AZProductionTest } from './AZProductionTest'
import type { AZProductionTestType } from './AZProductionTestType'
import type { AZReteTest } from './AZReteTest'
import type { AZReteRelationalType } from './AZReteTestType'
import type {
  AZReteTestBuildResult,
  AZReteTestBuilder,
} from './AZReteTestBuilder'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZVariableBindingManager } from './AZVariableBindingManager'
import type { AZReteFieldNumber } from './AZVariableLocation'

export class AZDefaultReteTestBuilder implements AZReteTestBuilder {
  public constructor(
    private readonly variableBindingManager: AZVariableBindingManager,
  ) {}

  public buildForTest(
    test: AZProductionTest,
    currentDepth: number,
    fieldNumber: AZReteFieldNumber,
    existingTests: readonly AZReteTest[],
    alphaConstant: AZSymbol | null,
  ): AZReteTestBuildResult {
    switch (test.type) {
      case 'EQUALITY':
        return this.buildEqualityTest(
          test,
          currentDepth,
          fieldNumber,
          existingTests,
          alphaConstant,
        )

      case 'NOT_EQUAL':
      case 'LESS':
      case 'GREATER':
      case 'LESS_OR_EQUAL':
      case 'GREATER_OR_EQUAL':
      case 'SAME_TYPE':
      case 'SMEM_LINK':
      case 'SMEM_LINK_NOT':
      case 'CONSTANT_MATCH':
        return this.buildRelationalTest(
          test,
          currentDepth,
          fieldNumber,
          existingTests,
          alphaConstant,
        )

      case 'DISJUNCTION': {
        if (!test.disjunction) {
          throw new Error('DISJUNCTION test requires symbols')
        }

        return {
          tests: this.prependTest(existingTests, {
            rightFieldNumber: fieldNumber,
            type: 'DISJUNCTION',
            data: {
              kind: 'DISJUNCTION',
              symbols: [...test.disjunction],
            },
          }),
          alphaConstant,
        }
      }

      case 'CONJUNCTIVE': {
        let tests = existingTests
        let currentAlphaConstant = alphaConstant

        for (const conjunct of test.conjuncts ?? []) {
          const result = this.buildForTest(
            conjunct,
            currentDepth,
            fieldNumber,
            tests,
            currentAlphaConstant,
          )

          tests = result.tests
          currentAlphaConstant = result.alphaConstant
        }

        return {
          tests,
          alphaConstant: currentAlphaConstant,
        }
      }

      case 'GOAL_ID':
        return {
          tests: this.prependTest(existingTests, {
            rightFieldNumber: 0,
            type: 'ID_IS_GOAL',
            data: { kind: 'NONE' },
          }),
          alphaConstant,
        }

      case 'IMPASSE_ID':
        return {
          tests: this.prependTest(existingTests, {
            rightFieldNumber: 0,
            type: 'ID_IS_IMPASSE',
            data: { kind: 'NONE' },
          }),
          alphaConstant,
        }

      case 'SMEM_LINK_UNARY':
        return {
          tests: this.prependTest(existingTests, {
            rightFieldNumber: fieldNumber,
            type: 'UNARY_SMEM_LINK',
            data: { kind: 'NONE' },
          }),
          alphaConstant,
        }

      case 'SMEM_LINK_UNARY_NOT':
        return {
          tests: this.prependTest(existingTests, {
            rightFieldNumber: fieldNumber,
            type: 'UNARY_SMEM_LINK_NOT',
            data: { kind: 'NONE' },
          }),
          alphaConstant,
        }
    }
  }

  private buildEqualityTest(
    test: AZProductionTest,
    currentDepth: number,
    fieldNumber: AZReteFieldNumber,
    existingTests: readonly AZReteTest[],
    alphaConstant: AZSymbol | null,
  ): AZReteTestBuildResult {
    const referent = this.requireReferent(test)

    if (referent.type !== 'VARIABLE') {
      if (alphaConstant === null) {
        return {
          tests: existingTests,
          alphaConstant: referent,
        }
      }

      return {
        tests: this.prependTest(existingTests, {
          rightFieldNumber: fieldNumber,
          type: 'CONSTANT_RELATIONAL',
          relationalType: 'EQUAL',
          data: {
            kind: 'CONSTANT',
            symbol: referent,
          },
        }),
        alphaConstant,
      }
    }

    const location = this.variableBindingManager.findLocation(
      referent,
      currentDepth,
    )

    if (location === null) {
      throw new Error(
        `Rete build found test of unbound variable: ${referent.id}`,
      )
    }

    if (
      location.levelsUp === 0 &&
      location.fieldNumber === fieldNumber
    ) {
      return {
        tests: existingTests,
        alphaConstant,
      }
    }

    return {
      tests: this.prependTest(existingTests, {
        rightFieldNumber: fieldNumber,
        type: 'VARIABLE_RELATIONAL',
        relationalType: 'EQUAL',
        data: {
          kind: 'VARIABLE',
          location,
        },
      }),
      alphaConstant,
    }
  }

  private buildRelationalTest(
    test: AZProductionTest,
    currentDepth: number,
    fieldNumber: AZReteFieldNumber,
    existingTests: readonly AZReteTest[],
    alphaConstant: AZSymbol | null,
  ): AZReteTestBuildResult {
    const referent = this.requireReferent(test)
    const relationalType = this.toRelationalType(test.type)

    if (referent.type !== 'VARIABLE') {
      return {
        tests: this.prependTest(existingTests, {
          rightFieldNumber: fieldNumber,
          type: 'CONSTANT_RELATIONAL',
          relationalType,
          data: {
            kind: 'CONSTANT',
            symbol: referent,
          },
        }),
        alphaConstant,
      }
    }

    const location = this.variableBindingManager.findLocation(
      referent,
      currentDepth,
    )

    if (location === null) {
      throw new Error(
        `Rete build found test of unbound variable: ${referent.id}`,
      )
    }

    return {
      tests: this.prependTest(existingTests, {
        rightFieldNumber: fieldNumber,
        type: 'VARIABLE_RELATIONAL',
        relationalType,
        data: {
          kind: 'VARIABLE',
          location,
        },
      }),
      alphaConstant,
    }
  }

  private prependTest(
    existingTests: readonly AZReteTest[],
    test: Omit<AZReteTest, 'next'>,
  ): readonly AZReteTest[] {
    const reteTest: AZReteTest = {
      ...test,
      next: existingTests[0] ?? null,
    }

    return [reteTest, ...existingTests]
  }

  private requireReferent(
    test: AZProductionTest,
  ): AZSymbol {
    if (!test.referent) {
      throw new Error(`${test.type} test requires a referent`)
    }

    return test.referent
  }

  private toRelationalType(
    type: AZProductionTestType,
  ): AZReteRelationalType {
    switch (type) {
      case 'NOT_EQUAL':
        return 'NOT_EQUAL'
      case 'LESS':
        return 'LESS'
      case 'GREATER':
        return 'GREATER'
      case 'LESS_OR_EQUAL':
        return 'LESS_OR_EQUAL'
      case 'GREATER_OR_EQUAL':
        return 'GREATER_OR_EQUAL'
      case 'SAME_TYPE':
        return 'SAME_TYPE'
      case 'SMEM_LINK':
        return 'SMEM_LINK'
      case 'SMEM_LINK_NOT':
        return 'SMEM_LINK_NOT'
      case 'CONSTANT_MATCH':
        return 'CONSTANT_MATCH'
      default:
        throw new Error(
          `Production test ${type} is not relational`,
        )
    }
  }
}
