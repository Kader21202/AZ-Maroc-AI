import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZProduction } from './AZProduction'
import type { AZInstantiation } from './AZInstantiation'
import type { AZProductionNode } from './AZProductionNode'
import type { AZToken } from './AZToken'

export type AZMatchAssertionType =
  | 'O_ASSERTION'
  | 'I_ASSERTION'

export interface AZMatchAssertion {
  readonly type: AZMatchAssertionType
  readonly production: AZProduction
  readonly token: AZToken
  readonly wme: AZWorkingMemoryElement | null
  readonly matchGoal: AZSymbol | null
  readonly matchGoalLevel: number
}

export interface AZMatchRetraction {
  readonly instantiation: AZInstantiation
  readonly productionNode: AZProductionNode
}

export class AZMatchSet {
  private readonly assertions:
    AZMatchAssertion[] = []

  private readonly retractions:
    AZMatchRetraction[] = []

  private readonly nilGoalRetractions:
    AZMatchRetraction[] = []

  private readonly postponedAssertions:
    AZMatchAssertion[] = []

  public addAssertion(
    assertion: AZMatchAssertion,
  ): void {
    this.assertions.unshift(assertion)
  }

  public cancelAssertion(
    token: AZToken,
  ): boolean {
    const index =
      this.assertions.findIndex(
        assertion =>
          assertion.token === token,
      )

    if (index < 0) {
      return false
    }

    this.assertions.splice(index, 1)
    return true
  }

  public addRetraction(
    retraction: AZMatchRetraction,
  ): void {
    this.retractions.unshift(retraction)
  }

  public addNilGoalRetraction(
    retraction: AZMatchRetraction,
  ): void {
    this.nilGoalRetractions.unshift(
      retraction,
    )
  }

  public transferRetractionsToNilGoal(
    matchGoal: AZSymbol,
  ): number {
    const transferred:
      AZMatchRetraction[] = []

    for (
      let index =
        this.retractions.length - 1;
      index >= 0;
      index -= 1
    ) {
      const retraction =
        this.retractions[index]

      if (
        retraction !== undefined &&
        retraction.instantiation.matchGoal ===
          matchGoal
      ) {
        this.retractions.splice(index, 1)
        transferred.unshift(retraction)
      }
    }

    if (transferred.length > 0) {
      this.nilGoalRetractions.unshift(
        ...transferred,
      )
    }

    return transferred.length
  }

  public takeNextNilGoalRetraction():
    AZInstantiation | null {
    const retraction =
      this.nilGoalRetractions.shift()

    return retraction?.instantiation ?? null
  }

  public getAssertions():
    readonly AZMatchAssertion[] {
    return [...this.assertions]
  }

  public getRetractions():
    readonly AZMatchRetraction[] {
    return [...this.retractions]
  }

  public getNilGoalRetractions():
    readonly AZMatchRetraction[] {
    return [...this.nilGoalRetractions]
  }

  public hasPendingChanges(): boolean {
    return (
      this.assertions.length > 0 ||
      this.retractions.length > 0 ||
      this.nilGoalRetractions.length > 0
    )
  }

  public hasAssertion(
    type: AZMatchAssertionType,
    matchGoal: AZSymbol | null,
  ): boolean {
    return this.assertions.some(
      assertion =>
        assertion.type === type &&
        assertion.matchGoal === matchGoal,
    )
  }

  public hasRetraction(
    matchGoal: AZSymbol | null,
  ): boolean {
    return this.retractions.some(
      retraction =>
        retraction.instantiation.matchGoal ===
        matchGoal,
    )
  }

  public postponeNextAssertion(
    type: AZMatchAssertionType,
    matchGoal: AZSymbol | null,
  ): AZMatchAssertion | null {
    const index =
      this.assertions.findIndex(
        assertion =>
          assertion.type === type &&
          assertion.matchGoal === matchGoal,
      )

    if (index < 0) {
      return null
    }

    const [assertion] =
      this.assertions.splice(index, 1)

    if (!assertion) {
      return null
    }

    this.postponedAssertions.unshift(
      assertion,
    )

    return assertion
  }

  public consumeLastPostponedAssertion():
    AZMatchAssertion | null {
    return (
      this.postponedAssertions.shift() ??
      null
    )
  }

  public restorePostponedAssertions(): void {
    while (
      this.postponedAssertions.length > 0
    ) {
      const assertion =
        this.postponedAssertions.shift()

      if (assertion) {
        this.assertions.unshift(assertion)
      }
    }
  }

  public cancelRetraction(
    productionNode: AZProductionNode,
    predicate:
      (instantiation: AZInstantiation) =>
        boolean,
  ): AZInstantiation | null {
    const index =
      this.retractions.findIndex(
        retraction =>
          retraction.productionNode ===
            productionNode &&
          predicate(
            retraction.instantiation,
          ),
      )

    if (index < 0) {
      return null
    }

    const [retraction] =
      this.retractions.splice(index, 1)

    return retraction?.instantiation ?? null
  }

  public takeNextRetraction(
    matchGoal: AZSymbol | null,
  ): AZInstantiation | null {
    const index =
      this.retractions.findIndex(
        retraction =>
          retraction.instantiation
            .matchGoal === matchGoal,
      )

    if (index < 0) {
      return null
    }

    const [retraction] =
      this.retractions.splice(index, 1)

    return retraction?.instantiation ?? null
  }
}
