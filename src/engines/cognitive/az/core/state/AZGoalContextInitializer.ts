import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalStateRegistry } from './AZGoalStateRegistry'
import type { AZGoalIdentityRegistry } from './AZGoalIdentityRegistry'
import type { AZGoalStructuralStateRegistry } from './AZGoalStructuralStateRegistry'
import type { AZIdentifierLinkStateRegistry } from './AZIdentifierLinkStateRegistry'

export class AZGoalContextInitializer {
  public constructor(
    private readonly goalStateRegistry:
      AZGoalStateRegistry,

    private readonly goalIdentityRegistry:
      AZGoalIdentityRegistry,

    private readonly identifierStateRegistry:
      AZIdentifierLinkStateRegistry,

    private readonly goalStructuralStateRegistry:
      AZGoalStructuralStateRegistry,

    private readonly preferenceMemory:
      AZPreferenceMemory,

    private readonly predefinedSymbols:
      AZPredefinedSymbols,
  ) {}

  public initialize(
    goal: AZSymbol,
    level: number,
  ): AZPreferenceSlot {
    if (goal.type !== 'IDENTIFIER') {
      throw new Error(
        'Goal context requires an identifier',
      )
    }

    this.goalStateRegistry.registerGoal(
      goal,
      level,
    )

    this.goalIdentityRegistry.registerGoal(
      goal,
      level,
    )

    this.identifierStateRegistry.register(
      goal,
      {
        level,
        promotionLevel: level,
      },
    )

    const structuralState =
      this.goalStructuralStateRegistry.register(
        goal,
      )

    const operatorSlot =
      this.preferenceMemory
        .getOrCreateContextSlot(
          goal,
          this.predefinedSymbols.operator,
        )

    structuralState.operatorSlot =
      operatorSlot

    return operatorSlot
  }
}
