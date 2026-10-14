import type { AZProductionTest } from './AZProductionTest'
import { findAZEqualityTest } from './AZProductionTestEquality'
import type { AZVariableBindingManager } from './AZVariableBindingManager'
import type { AZSymbol } from '../symbols/AZSymbol'
import type {
  AZReteFieldNumber,
  AZVariableLocation,
} from './AZVariableLocation'

interface AZVariableBinding {
  readonly depth: number
  readonly fieldNumber: AZReteFieldNumber
}

export class AZDefaultVariableBindingManager implements AZVariableBindingManager {
  private readonly bindings =
    new Map<string, AZVariableBinding[]>()

  public isBound(variable: AZSymbol): boolean {
    return (
      (this.bindings.get(variable.id)?.length ?? 0) > 0
    )
  }

  public pushBinding(
    variable: AZSymbol,
    depth: number,
    fieldNumber: AZReteFieldNumber,
  ): void {
    if (variable.type !== 'VARIABLE') {
      throw new Error(
        'Only variables can receive Rete bindings',
      )
    }

    const stack =
      this.bindings.get(variable.id) ?? []

    stack.push({
      depth,
      fieldNumber,
    })

    this.bindings.set(variable.id, stack)
  }

  public popBinding(variable: AZSymbol): void {
    const stack = this.bindings.get(variable.id)

    if (!stack || stack.length === 0) {
      throw new Error(
        `Variable ${variable.id} has no Rete binding to pop`,
      )
    }

    stack.pop()

    if (stack.length === 0) {
      this.bindings.delete(variable.id)
    }
  }

  public findLocation(
    variable: AZSymbol,
    currentDepth: number,
  ): AZVariableLocation | null {
    const stack = this.bindings.get(variable.id)

    if (!stack || stack.length === 0) {
      return null
    }

    const binding = stack[stack.length - 1]

    if (!binding) {
      return null
    }

    return {
      levelsUp: currentDepth - binding.depth,
      fieldNumber: binding.fieldNumber,
    }
  }

  public bindVariablesInTest(
    test: AZProductionTest,
    depth: number,
    fieldNumber: AZReteFieldNumber,
    dense: boolean,
  ): readonly AZSymbol[] {
    const equalityTest =
      findAZEqualityTest(test)

    const referent = equalityTest?.referent

    if (
      !referent ||
      referent.type !== 'VARIABLE'
    ) {
      return []
    }

    if (!dense && this.isBound(referent)) {
      return []
    }

    this.pushBinding(
      referent,
      depth,
      fieldNumber,
    )

    return [referent]
  }

  public popBindings(
    variables: readonly AZSymbol[],
  ): void {
    for (const variable of variables) {
      this.popBinding(variable)
    }
  }
}
