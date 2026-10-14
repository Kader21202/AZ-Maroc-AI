import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalStateResolver } from './AZGoalStateResolver'
import type { AZInstantiatedCondition } from './AZInstantiatedCondition'
import type { AZInstantiatedConditionBuilder } from './AZInstantiatedConditionBuilder'
import type { AZMatchAssertionType } from './AZMatchSet'
import type { AZProductionAction } from './AZProductionAction'
import type { AZProductionAssertionTypeResolver } from './AZProductionAssertionTypeResolver'
import type { AZProductionNode } from './AZProductionNode'
import type { AZProductionRhsIdentifierResolver } from './AZProductionRhsIdentifierResolver'
import type { AZProductionRhsValue } from './AZProductionRhsValue'
import type { AZToken } from './AZToken'

export class AZDefaultProductionAssertionTypeResolver
  implements AZProductionAssertionTypeResolver
{
  public constructor(
    private readonly operatorSymbol: AZSymbol,
    private readonly goalStateResolver: AZGoalStateResolver,
    private readonly instantiatedConditionBuilder:
      AZInstantiatedConditionBuilder,
    private readonly rhsIdentifierResolver:
      AZProductionRhsIdentifierResolver,
  ) {}

  public resolve(
    productionNode: AZProductionNode,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): AZMatchAssertionType {
    const support =
      productionNode.production.declaredSupport

    switch (support) {
      case 'O_SUPPORT':
        return 'O_ASSERTION'

      case 'I_SUPPORT':
        return 'I_ASSERTION'

      case 'UNDECLARED':
        if (
          this.isOperatorProposal(
            productionNode.production.actions,
            parentToken,
            workingMemoryElement,
          )
        ) {
          return 'I_ASSERTION'
        }

        if (
          this.isOperatorElaboration(
            productionNode,
            parentToken,
            workingMemoryElement,
          )
        ) {
          return 'I_ASSERTION'
        }

        if (
          this.isOperatorApplication(
            productionNode,
            parentToken,
            workingMemoryElement,
          )
        ) {
          return 'O_ASSERTION'
        }

        return 'I_ASSERTION'
    }
  }

  private isOperatorProposal(
    actions: readonly AZProductionAction[],
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): boolean {
    for (const action of actions) {
      if (
        action.type !== 'MAKE' ||
        action.preferenceType !== 'ACCEPTABLE'
      ) {
        continue
      }

      if (
        action.attribute.type !== 'SYMBOL' ||
        action.attribute.symbol !== this.operatorSymbol
      ) {
        continue
      }

      const identifier =
        this.resolveIdentifier(
          action.identifier,
          parentToken,
          workingMemoryElement,
        )

      if (
        identifier !== null &&
        this.goalStateResolver.isGoal(identifier)
      ) {
        return true
      }
    }

    return false
  }

  private isOperatorElaboration(
    productionNode: AZProductionNode,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): boolean {
    const selectedOperator =
      this.resolveSelectedOperator(
        productionNode,
        parentToken,
        workingMemoryElement,
      )

    if (selectedOperator === null) {
      return false
    }

    for (const action of productionNode.production.actions) {
      if (action.type !== 'MAKE') {
        continue
      }

      const identifier =
        this.resolveIdentifier(
          action.identifier,
          parentToken,
          workingMemoryElement,
        )

      if (identifier === selectedOperator) {
        return true
      }
    }

    return false
  }

  private isOperatorApplication(
    productionNode: AZProductionNode,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): boolean {
    const selectedOperator =
      this.resolveSelectedOperator(
        productionNode,
        parentToken,
        workingMemoryElement,
      )

    if (selectedOperator === null) {
      return false
    }

    for (const action of productionNode.production.actions) {
      if (action.type !== 'MAKE') {
        continue
      }

      const identifier =
        this.resolveIdentifier(
          action.identifier,
          parentToken,
          workingMemoryElement,
        )

      if (
        identifier !== null &&
        identifier !== selectedOperator
      ) {
        return true
      }
    }

    return false
  }

  private resolveSelectedOperator(
    productionNode: AZProductionNode,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): AZSymbol | null {
    const conditions =
      this.instantiatedConditionBuilder.build(
        productionNode.production,
        productionNode,
        parentToken,
        workingMemoryElement,
      )

    const deepestGoal =
      this.findDeepestGoal(conditions)

    if (deepestGoal === null) {
      return null
    }

    return this.findSelectedOperator(
      conditions,
      deepestGoal,
    )
  }

  private findDeepestGoal(
    conditions: readonly AZInstantiatedCondition[],
  ): AZSymbol | null {
    let deepestGoal: AZSymbol | null = null
    let deepestLevel = -1

    for (const condition of conditions) {
      if (
        condition.type !== 'POSITIVE' ||
        condition.workingMemoryElement === null
      ) {
        continue
      }

      const identifier =
        condition.workingMemoryElement.identifier

      if (!this.goalStateResolver.isGoal(identifier)) {
        continue
      }

      const level =
        this.goalStateResolver.getLevel(identifier)

      if (level > deepestLevel) {
        deepestLevel = level
        deepestGoal = identifier
      }
    }

    return deepestGoal
  }

  private findSelectedOperator(
    conditions: readonly AZInstantiatedCondition[],
    deepestGoal: AZSymbol,
  ): AZSymbol | null {
    for (const condition of conditions) {
      if (
        condition.type !== 'POSITIVE' ||
        condition.workingMemoryElement === null
      ) {
        continue
      }

      const wme =
        condition.workingMemoryElement

      if (
        wme.identifier === deepestGoal &&
        wme.attribute === this.operatorSymbol &&
        !wme.acceptable
      ) {
        return wme.value
      }
    }

    return null
  }

  private resolveIdentifier(
    value: AZProductionRhsValue,
    parentToken: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): AZSymbol | null {
    if (value.type === 'SYMBOL') {
      return value.symbol
    }

    if (workingMemoryElement === null) {
      return null
    }

    return this.rhsIdentifierResolver.resolve(
      value,
      parentToken,
      workingMemoryElement,
    )
  }
}
