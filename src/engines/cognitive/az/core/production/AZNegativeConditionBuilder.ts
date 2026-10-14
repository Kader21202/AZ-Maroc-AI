import type { AZMatchSet } from './AZMatchSet'
import type { AZNegativeNode } from './AZNegativeNode'
import type { AZProductionCondition } from './AZProductionCondition'
import type { AZReteActivationEngine } from './AZReteActivationEngine'
import type { AZReteHashExtractor } from './AZReteHashExtractor'
import type { AZReteLinkManager } from './AZReteLinkManager'
import type { AZReteNode } from './AZReteNode'
import type { AZReteNodeBase } from './AZReteNodeBase'
import type { AZReteNodeFactory } from './AZReteNodeFactory'
import type { AZReteTest } from './AZReteTest'
import type { AZReteTestBuilder } from './AZReteTestBuilder'
import type { AZAlphaMemoryManager } from './AZAlphaMemoryManager'
import type { AZVariableBindingManager } from './AZVariableBindingManager'
import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZNegativeConditionBuilder {
  build(
    condition: AZProductionCondition,
    currentDepth: number,
    parent: AZReteNode,
  ): AZReteNode
}

export class AZDefaultNegativeConditionBuilder
  implements AZNegativeConditionBuilder
{
  public constructor(
    private readonly variableBindingManager:
      AZVariableBindingManager,
    private readonly reteTestBuilder:
      AZReteTestBuilder,
    private readonly reteHashExtractor:
      AZReteHashExtractor,
    private readonly alphaMemoryManager:
      AZAlphaMemoryManager,
    private readonly nodeFactory:
      AZReteNodeFactory,
    private readonly activationEngine?:
      AZReteActivationEngine,
    private readonly matchSet?:
      AZMatchSet,
    private readonly linkManager?:
      AZReteLinkManager,
  ) {}

  public build(
    condition: AZProductionCondition,
    currentDepth: number,
    parent: AZReteNode,
  ): AZReteNode {
    if (condition.type !== 'NEGATIVE') {
      throw new Error(
        'AZ negative condition builder requires a NEGATIVE condition',
      )
    }

    const boundVariables: AZSymbol[] = []

    try {
      boundVariables.push(
        ...this.variableBindingManager.bindVariablesInTest(
          condition.identifierTest,
          currentDepth,
          0,
          false,
        ),
        ...this.variableBindingManager.bindVariablesInTest(
          condition.attributeTest,
          currentDepth,
          1,
          false,
        ),
        ...this.variableBindingManager.bindVariablesInTest(
          condition.valueTest,
          currentDepth,
          2,
          false,
        ),
      )

      let tests: readonly AZReteTest[] = []

      const identifierResult =
        this.reteTestBuilder.buildForTest(
          condition.identifierTest,
          currentDepth,
          0,
          tests,
          null,
        )

      tests = identifierResult.tests

      const hashResult =
        this.reteHashExtractor.extract(tests)

      tests = hashResult.remainingTests

      const attributeResult =
        this.reteTestBuilder.buildForTest(
          condition.attributeTest,
          currentDepth,
          1,
          tests,
          null,
        )

      tests = attributeResult.tests

      const valueResult =
        this.reteTestBuilder.buildForTest(
          condition.valueTest,
          currentDepth,
          2,
          tests,
          null,
        )

      tests = valueResult.tests

      const alphaMemory =
        this.alphaMemoryManager.findOrCreate(
          identifierResult.alphaConstant,
          attributeResult.alphaConstant,
          valueResult.alphaConstant,
          condition.acceptable,
        )

      const expectedType =
        hashResult.hashed
          ? 'NEGATIVE'
          : 'UNHASHED_NEGATIVE'

      for (const child of parent.children) {
        if (!this.isNegativeNode(child)) {
          continue
        }

        if (child.type !== expectedType) {
          continue
        }

        if (
          child.leftHashFieldNumber !==
            hashResult.leftHashLocation.fieldNumber ||
          child.leftHashLevelsUp !==
            hashResult.leftHashLocation.levelsUp ||
          child.alphaMemory !== alphaMemory ||
          !this.areTestsEqual(
            child.tests,
            tests,
          )
        ) {
          continue
        }

        /*
         * findOrCreate() increments the reference
         * count. Reusing the existing RETE node does
         * not create another ownership reference.
         */
        this.alphaMemoryManager.removeReference(
          alphaMemory,
        )

        return child
      }

      const node =
        this.nodeFactory.createNegativeNode(
          parent,
          hashResult.hashed,
          hashResult.leftHashLocation,
          alphaMemory,
          tests,
        )

      if (
        this.activationEngine !== undefined &&
        this.matchSet !== undefined
      ) {
        this.activationEngine
          .updateNodeWithMatchesFromAbove(
            node,
            this.matchSet,
          )

        if (
          node.tokens.length === 0 &&
          this.linkManager !== undefined
        ) {
          this.linkManager.unlinkRight(node)
        }
      }

      return node
    } finally {
      this.variableBindingManager.popBindings(
        boundVariables,
      )
    }
  }

  private isNegativeNode(
    node: AZReteNodeBase,
  ): node is AZNegativeNode {
    return (
      node.type === 'NEGATIVE' ||
      node.type === 'UNHASHED_NEGATIVE'
    )
  }

  private areTestsEqual(
    left: readonly AZReteTest[],
    right: readonly AZReteTest[],
  ): boolean {
    if (left.length !== right.length) {
      return false
    }

    return left.every(
      (test, index) =>
        this.areTestValuesEqual(
          test,
          right[index]!,
        ),
    )
  }

  private areTestValuesEqual(
    left: AZReteTest,
    right: AZReteTest,
  ): boolean {
    if (
      left.rightFieldNumber !==
        right.rightFieldNumber ||
      left.type !== right.type ||
      left.relationalType !==
        right.relationalType ||
      left.data.kind !== right.data.kind
    ) {
      return false
    }

    switch (left.data.kind) {
      case 'VARIABLE':
        return (
          right.data.kind === 'VARIABLE' &&
          left.data.location.levelsUp ===
            right.data.location.levelsUp &&
          left.data.location.fieldNumber ===
            right.data.location.fieldNumber
        )

      case 'CONSTANT':
        return (
          right.data.kind === 'CONSTANT' &&
          left.data.symbol ===
            right.data.symbol
        )

      case 'DISJUNCTION': {
        if (right.data.kind !== 'DISJUNCTION') {
          return false
        }

        const rightSymbols =
          right.data.symbols

        return (
          left.data.symbols.length ===
            rightSymbols.length &&
          left.data.symbols.every(
            (symbol, index) =>
              symbol === rightSymbols[index],
          )
        )
      }

      case 'NONE':
        return right.data.kind === 'NONE'
    }
  }
}
