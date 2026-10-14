import type { ContextDecisionObserver } from './ContextDecisionObserver'
import type { ContextDecisionObservation } from './ContextDecisionObservation'

type CognitiveObservedImpasseType = Extract<
  ContextDecisionObservation,
  { readonly type: 'IMPASSE_DETECTED' }
>['impasseType']

type ObservedImpasseType =
  | CognitiveObservedImpasseType
  | 'NONE'

interface ObservedSymbol {
  readonly id: string
}

interface ObservedWorkingMemoryElement {
  readonly value: ObservedSymbol
}

interface ObservedPreferenceSlot {
  readonly wmes: readonly ObservedWorkingMemoryElement[]
}

interface ObservedGoal {
  readonly operatorSlot: ObservedPreferenceSlot | null
  readonly impasseType: ObservedImpasseType
}

interface ContextSlotDeciderLike {
  decide(
    goal: ObservedGoal,
    slot: ObservedPreferenceSlot,
    workingMemory: unknown,
    matchSet: unknown,
  ): boolean
}

interface GoalStateStackLike {
  findByGoal(
    goal: ObservedGoal,
  ): {
    readonly lower: {
      readonly goal: ObservedGoal
    } | null
  } | null
}

export class ObservingContextSlotDecider {
  public constructor(
    private readonly delegate: object,
    private readonly observer: ContextDecisionObserver,
    private readonly stateStack: object,
  ) {}

  public decide(
    goal: ObservedGoal,
    slot: ObservedPreferenceSlot,
    workingMemory: unknown,
    matchSet: unknown,
  ): boolean {
    const delegate =
      this.delegate as ContextSlotDeciderLike

    const decisionMade = delegate.decide(
      goal,
      slot,
      workingMemory,
      matchSet,
    )

    if (
      goal.operatorSlot === slot &&
      slot.wmes.length !== 0
    ) {
      const operatorWme = slot.wmes[0]

      if (operatorWme !== undefined) {
        this.observer.observe({
          type: 'OPERATOR_SELECTED',
          operatorId: operatorWme.value.id,
        })
      }

      return decisionMade
    }

    const stack =
      this.stateStack as GoalStateStackLike

    const context =
      stack.findByGoal(goal)

    const impasseType =
      context?.lower?.goal.impasseType

    if (
      impasseType !== undefined &&
      impasseType !== 'NONE'
    ) {
      this.observer.observe({
        type: 'IMPASSE_DETECTED',
        impasseType,
      })
    }

    return decisionMade
  }
}
