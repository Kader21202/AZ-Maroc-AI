import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZAlphaMemoryManager } from './AZAlphaMemoryManager'
import type { AZMatchSet } from './AZMatchSet'
import type { AZProductionCondition } from './AZProductionCondition'
import type { AZReteActivationEngine } from './AZReteActivationEngine'
import type { AZReteHashExtractor } from './AZReteHashExtractor'
import type { AZMemoryNode } from './AZMemoryNode'
import type { AZMpNode } from './AZMpNode'
import type { AZPositiveNode } from './AZPositiveNode'
import type { AZReteNode } from './AZReteNode'
import type { AZReteNodeFactory } from './AZReteNodeFactory'
import type { AZReteMpNodeManager } from './AZReteMpNodeManager'
import type { AZReteTest } from './AZReteTest'
import type { AZReteTestBuilder } from './AZReteTestBuilder'
import type { AZVariableBindingManager } from './AZVariableBindingManager'

type AZPositiveCondition = Extract<
  AZProductionCondition,
  { readonly type: 'POSITIVE' }
>

export interface AZPositiveConditionBuilder {
  build(
    condition: AZPositiveCondition,
    currentDepth: number,
    parent: AZReteNode,
  ): AZReteNode
}

export class AZDefaultPositiveConditionBuilder
  implements AZPositiveConditionBuilder
{
  public constructor(
    private readonly variableBindingManager: AZVariableBindingManager,
    private readonly reteTestBuilder: AZReteTestBuilder,
    private readonly reteHashExtractor: AZReteHashExtractor,
    private readonly alphaMemoryManager: AZAlphaMemoryManager,
    private readonly nodeFactory: AZReteNodeFactory,
    private readonly mpNodeManager: AZReteMpNodeManager,
    private readonly reteActivationEngine?: AZReteActivationEngine,
    private readonly matchSet?: AZMatchSet,
  ) {}

  public build(
    condition: AZPositiveCondition,
    currentDepth: number,
    parent: AZReteNode,
  ): AZReteNode {
    const sparseBindings: AZSymbol[] = []

    try {
      sparseBindings.push(
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

      const idResult = this.reteTestBuilder.buildForTest(
        condition.identifierTest,
        currentDepth,
        0,
        [],
        null,
      )

      const hashResult =
        this.reteHashExtractor.extract(idResult.tests)

      const attributeResult = this.reteTestBuilder.buildForTest(
        condition.attributeTest,
        currentDepth,
        1,
        hashResult.remainingTests,
        null,
      )

      const valueResult = this.reteTestBuilder.buildForTest(
        condition.valueTest,
        currentDepth,
        2,
        attributeResult.tests,
        null,
      )

      const alphaMemory =
        this.alphaMemoryManager.findOrCreate(
          idResult.alphaConstant,
          attributeResult.alphaConstant,
          valueResult.alphaConstant,
          condition.acceptable,
        )

      const hashed = hashResult.hashed
      const location = hashResult.leftHashLocation
      const tests = valueResult.tests

      const memoryNode = this.findMatchingMemoryNode(
        parent,
        hashed,
        location.fieldNumber,
        location.levelsUp,
      )

      if (memoryNode !== null) {
        const positiveNode = this.findMatchingPositiveNode(
          memoryNode,
          hashed,
          alphaMemory,
          tests,
        )

        if (positiveNode !== null) {
          this.alphaMemoryManager.removeReference(alphaMemory)
          return positiveNode
        }

        return this.nodeFactory.createPositiveNode(
          memoryNode,
          hashed,
          alphaMemory,
          tests,
        )
      }

      const mpNode = this.findMatchingMpNode(
        parent,
        hashed,
        location.fieldNumber,
        location.levelsUp,
      )

      if (mpNode !== null) {
        if (
          mpNode.alphaMemory === alphaMemory &&
          this.reteTestsAreIdentical(mpNode.tests, tests)
        ) {
          this.alphaMemoryManager.removeReference(alphaMemory)
          return mpNode
        }

        const splitMemory =
          this.mpNodeManager.splitMpNode(mpNode)

        return this.nodeFactory.createPositiveNode(
          splitMemory,
          hashed,
          alphaMemory,
          tests,
        )
      }

      const createdMpNode = this.nodeFactory.createMpNode(
        parent,
        hashed,
        location,
        alphaMemory,
        tests,
      )

      if (
        this.reteActivationEngine !== undefined &&
        this.matchSet !== undefined
      ) {
        this.reteActivationEngine.updateNodeWithMatchesFromAbove(
          createdMpNode,
          this.matchSet,
        )
      }

      return createdMpNode
    } finally {
      this.variableBindingManager.popBindings(sparseBindings)
    }
  }

  private findMatchingMemoryNode(
    parent: AZReteNode,
    hashed: boolean,
    fieldNumber: 0 | 1 | 2,
    levelsUp: number,
  ): AZMemoryNode | null {
    const expectedType =
      hashed ? 'MEMORY' : 'UNHASHED_MEMORY'

    for (const child of parent.children) {
      if (child.type !== expectedType) continue
      if (!this.isMemoryNode(child)) continue

      if (
        !hashed ||
        (
          child.leftHashFieldNumber === fieldNumber &&
          child.leftHashLevelsUp === levelsUp
        )
      ) {
        return child
      }
    }

    return null
  }

  private findMatchingPositiveNode(
    memoryNode: AZMemoryNode,
    hashed: boolean,
    alphaMemory: AZPositiveNode['alphaMemory'],
    tests: readonly AZReteTest[],
  ): AZPositiveNode | null {
    const expectedType =
      hashed ? 'POSITIVE' : 'UNHASHED_POSITIVE'

    for (const child of memoryNode.children) {
      if (child.type !== expectedType) continue
      if (!this.isPositiveNode(child)) continue

      if (
        child.alphaMemory === alphaMemory &&
        this.reteTestsAreIdentical(child.tests, tests)
      ) {
        return child
      }
    }

    return null
  }

  private findMatchingMpNode(
    parent: AZReteNode,
    hashed: boolean,
    fieldNumber: 0 | 1 | 2,
    levelsUp: number,
  ): AZMpNode | null {
    const expectedType =
      hashed ? 'MP' : 'UNHASHED_MP'

    for (const child of parent.children) {
      if (child.type !== expectedType) continue
      if (!this.isMpNode(child)) continue

      if (
        !hashed ||
        (
          child.leftHashFieldNumber === fieldNumber &&
          child.leftHashLevelsUp === levelsUp
        )
      ) {
        return child
      }
    }

    return null
  }

  private reteTestsAreIdentical(
    left: readonly AZReteTest[],
    right: readonly AZReteTest[],
  ): boolean {
    if (left.length !== right.length) return false

    return left.every(
      (test, index) =>
        this.reteTestIsIdentical(test, right[index]!),
    )
  }

  private reteTestIsIdentical(
    left: AZReteTest,
    right: AZReteTest,
  ): boolean {
    if (
      left.rightFieldNumber !== right.rightFieldNumber ||
      left.type !== right.type ||
      left.relationalType !== right.relationalType ||
      left.data.kind !== right.data.kind
    ) {
      return false
    }

    switch (left.data.kind) {
      case 'VARIABLE':
        return (
          right.data.kind === 'VARIABLE' &&
          left.data.location.fieldNumber ===
            right.data.location.fieldNumber &&
          left.data.location.levelsUp ===
            right.data.location.levelsUp
        )

      case 'CONSTANT':
        return (
          right.data.kind === 'CONSTANT' &&
          left.data.symbol === right.data.symbol
        )

      case 'DISJUNCTION': {
        if (right.data.kind !== 'DISJUNCTION') {
          return false
        }

        const rightSymbols = right.data.symbols

        return (
          left.data.symbols.length === rightSymbols.length &&
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

  private isMemoryNode(
    node: { readonly type: string },
  ): node is AZMemoryNode {
    return (
      node.type === 'MEMORY' ||
      node.type === 'UNHASHED_MEMORY'
    )
  }

  private isPositiveNode(
    node: { readonly type: string },
  ): node is AZPositiveNode {
    return (
      node.type === 'POSITIVE' ||
      node.type === 'UNHASHED_POSITIVE'
    )
  }

  private isMpNode(
    node: { readonly type: string },
  ): node is AZMpNode {
    return (
      node.type === 'MP' ||
      node.type === 'UNHASHED_MP'
    )
  }
}
