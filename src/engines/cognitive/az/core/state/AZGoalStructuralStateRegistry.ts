import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZImpasseType } from '../decision/AZImpasseType'

export interface AZGoalStructuralState {
  operatorSlot: AZPreferenceSlot | null
  impasseType: AZImpasseType
  impasseAttribute: AZSymbol | null
  readonly impasseWmes: AZWorkingMemoryElement[]
}

export interface AZGoalStructuralStateRegistry {
  has(goal: AZSymbol): boolean

  get(
    goal: AZSymbol,
  ): AZGoalStructuralState

  register(
    goal: AZSymbol,
    initial?: Partial<AZGoalStructuralState>,
  ): AZGoalStructuralState

  remove(
    goal: AZSymbol,
  ): void
}

export class AZDefaultGoalStructuralStateRegistry
  implements AZGoalStructuralStateRegistry
{
  private readonly states =
    new Map<
      AZSymbol,
      AZGoalStructuralState
    >()

  public has(
    goal: AZSymbol,
  ): boolean {
    return this.states.has(goal)
  }

  public get(
    goal: AZSymbol,
  ): AZGoalStructuralState {
    const state =
      this.states.get(goal)

    if (state === undefined) {
      throw new Error(
        'Goal structural state is not registered',
      )
    }

    return state
  }

  public register(
    goal: AZSymbol,
    initial:
      Partial<AZGoalStructuralState> = {},
  ): AZGoalStructuralState {
    const existing =
      this.states.get(goal)

    if (existing !== undefined) {
      return existing
    }

    if (goal.type !== 'IDENTIFIER') {
      throw new Error(
        'Goal structural state requires an identifier',
      )
    }

    const state:
      AZGoalStructuralState = {
        operatorSlot:
          initial.operatorSlot ?? null,
        impasseType:
          initial.impasseType ?? 'NONE',
        impasseAttribute:
          initial.impasseAttribute ?? null,
        impasseWmes:
          initial.impasseWmes ?? [],
      }

    this.states.set(
      goal,
      state,
    )

    return state
  }

  public remove(
    goal: AZSymbol,
  ): void {
    this.states.delete(goal)
  }
}
