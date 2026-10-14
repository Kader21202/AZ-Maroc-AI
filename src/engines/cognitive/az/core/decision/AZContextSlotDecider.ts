import type { AZContextPreferenceSemantics } from './AZContextPreferenceSemantics'
import type { AZContextPreferenceSemanticsResult } from './AZContextPreferenceSemanticsResult'
import type { AZContextSlotWmeRemover } from './AZContextSlotWmeRemover'
import type { AZContextPreferenceWmeRegistry } from './AZContextPreferenceWmeRegistry'
import type { AZImpasseItemsUpdater } from './AZImpasseItemsUpdater'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZMatchSet } from '../production/AZMatchSet'
import type { AZCognitiveRunControl } from '../cycle/AZCognitiveRunControl'
import type { AZExistingContextRemover } from '../state/AZExistingContextRemover'
import type { AZGoalContextStack } from '../state/AZGoalContextStack'
import type { AZGoalDepthPolicy } from '../state/AZGoalDepthPolicy'
import type { AZGoalStateRegistry } from '../state/AZGoalStateRegistry'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type { AZLowerContextCreator } from '../state/AZLowerContextCreator'
import type { AZImpasseType } from './AZImpasseType'
import type { AZContextDecisionObserver } from './AZContextDecisionObserver'
import type { AZSymbol } from '../symbols/AZSymbol'

interface AZGoalDepthControl {
  readonly policy: AZGoalDepthPolicy
  readonly goalStateRegistry: AZGoalStateRegistry
  readonly runControl: AZCognitiveRunControl
}

export class AZContextSlotDecider {
  public constructor(
    private readonly semantics:
      AZContextPreferenceSemantics,

    private readonly contextStack:
      AZGoalContextStack,

    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,

    private readonly lowerContextCreator:
      AZLowerContextCreator,

    private readonly existingContextRemover:
      AZExistingContextRemover,

    private readonly contextSlotWmeRemover:
      AZContextSlotWmeRemover,

    private readonly contextPreferenceWmeRegistry:
      AZContextPreferenceWmeRegistry,

    private readonly impasseItemsUpdater:
      AZImpasseItemsUpdater,

    private readonly stateSymbol:
      AZSymbol,

    private readonly observer?:
      AZContextDecisionObserver,

    private readonly goalDepthControl?:
      AZGoalDepthControl,
  ) {}

  public decide(
    slot: AZPreferenceSlot,
    workingMemory: AZWorkingMemory,
    matchSet: AZMatchSet,
  ): boolean {
    return this.decideWithResult(
      slot,
      workingMemory,
      matchSet,
      this.semantics.evaluate(slot),
    )
  }

  public decideWithResult(
    slot: AZPreferenceSlot,
    workingMemory: AZWorkingMemory,
    matchSet: AZMatchSet,
    result: AZContextPreferenceSemanticsResult,
    preserveSelectedWme = false,
  ): boolean {
    if (!slot.isaContextSlot) {
      throw new Error(
        'Context slot decision requires a context slot',
      )
    }

    const parent =
      this.contextStack.findByGoal(
        slot.identifier,
      )

    if (parent === null) {
      throw new Error(
        'Context slot identifier does not belong to the goal stack',
      )
    }

    if (
      result.impasseType === 'NONE' &&
      result.candidates.length === 0
    ) {
      if (!preserveSelectedWme && slot.wmes.length > 0) {
        this.contextSlotWmeRemover.remove(
          slot,
          workingMemory,
        )
      }

      result = {
        impasseType: 'NO_CHANGE',
        candidates: [],
      }
    }

    if (result.impasseType === 'NONE') {
      if (result.candidates.length !== 1) {
        throw new Error(
          'Successful context decision requires exactly one candidate',
        )
      }

      const winner =
        result.candidates[0]

      if (winner === undefined) {
        throw new Error(
          'Missing context decision winner',
        )
      }

      const existing =
        slot.wmes[0]

      if (existing !== undefined) {
        this.contextSlotWmeRemover.remove(
          slot,
          workingMemory,
        )
      } else if (slot.wmes.length > 0) {
        slot.wmes.length = 0
      }

      if (parent.lower !== null) {
        this.existingContextRemover.remove(
          parent.lower.goal,
          workingMemory,
          matchSet,
        )
      }

      const winnerWme =
        workingMemory.createElement(
          winner.identifier,
          winner.attribute,
          winner.value,
          false,
        )

      slot.wmes.unshift(
        winnerWme,
      )


      this.contextPreferenceWmeRegistry.set(
        winnerWme,
        winner,
      )
      workingMemory.scheduleAdd(
        winnerWme,
      )

      slot.impasseType = 'NONE'
      slot.impasseId = null


      this.observer?.observe({
        type: 'OPERATOR_SELECTED',
        operatorId: winner.value.id,
      })

      return true
    }

    this.assertDecisionImpasse(
      result.impasseType,
    )

    if (!preserveSelectedWme && slot.wmes.length > 0) {
      this.contextSlotWmeRemover.remove(
        slot,
        workingMemory,
      )
    }

    const impasseAttribute =
      result.impasseType === 'NO_CHANGE' &&
      slot.wmes.length === 0
        ? this.stateSymbol
        : slot.attribute
    if (impasseAttribute === this.stateSymbol) {
      const parentStructuralState =
        this.structuralRegistry.get(parent.goal)

      if (
        parentStructuralState.operatorSlot !== null &&
        parentStructuralState.operatorSlot.wmes.length > 0
      ) {
        this.contextSlotWmeRemover.remove(
          parentStructuralState.operatorSlot,
          workingMemory,
        )
      }
    }

    const existingLower =
      parent.lower

    if (
      existingLower !== null &&
      this.isMatchingImpasse(
        existingLower.goal,
        impasseAttribute,
        result.impasseType,
      )
    ) {
      slot.impasseType =
        result.impasseType

      slot.impasseId =
        existingLower.goal

      this.impasseItemsUpdater.update(
        existingLower.goal,
        result.candidates,
        workingMemory,
      )


      this.observeImpasse(
        result.impasseType,
      )

      return false
    }

    if (existingLower !== null) {
      this.existingContextRemover.remove(
        existingLower.goal,
        workingMemory,
        matchSet,
      )
    }

    const created =
      this.lowerContextCreator.create(
        parent,
        impasseAttribute,
        result.impasseType,
      )

    if (
      result.impasseType === 'NO_CHANGE' &&
      this.goalDepthControl !== undefined
    ) {
      const createdLevel =
        this.goalDepthControl.goalStateRegistry
          .getLevel(created.goal)

      if (
        !this.goalDepthControl.policy
          .isAllowed(createdLevel)
      ) {
        this.goalDepthControl.runControl.halt(
          'Max goal depth exceeded.',
        )
      }
    }

    slot.impasseType =
      result.impasseType

    slot.impasseId =
      created.goal

    this.impasseItemsUpdater.update(
      created.goal,
      result.candidates,
      workingMemory,
    )


    this.observeImpasse(
      result.impasseType,
    )

    return true
  }

  private observeImpasse(
    type: AZImpasseType,
  ): void {
    if (type === 'NONE') {
      throw new Error(
        'AZ cannot observe NONE as an impasse.',
      )
    }

    this.observer?.observe({
      type: 'IMPASSE_DETECTED',
      impasseType:
        type === 'NO_CHANGE'
          ? 'ONC'
          : type,
    })
  }

  private isMatchingImpasse(
    goal:
      Parameters<
        AZGoalStructuralStateRegistry['get']
      >[0],
    attribute: AZSymbol,
    type: AZImpasseType,
  ): boolean {
    if (
      !this.structuralRegistry.has(goal)
    ) {
      return false
    }

    const structuralState =
      this.structuralRegistry.get(goal)

    const expectedType =
      type === 'NO_CHANGE'
        ? 'ONC'
        : type

    return (
      structuralState.impasseType ===
        expectedType &&
      structuralState.impasseAttribute ===
        attribute
    )
  }

  private assertDecisionImpasse(
    type: AZImpasseType,
  ): void {
    if (
      type === 'CONSTRAINT_FAILURE' ||
      type === 'CONFLICT' ||
      type === 'TIE' ||
      type === 'NO_CHANGE'
    ) {
      return
    }

    throw new Error(
      'Unsupported context decision impasse type',
    )
  }
}
