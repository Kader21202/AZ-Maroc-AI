import type { AZImpasseType } from '../decision/AZImpasseType'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'
import type { AZGoalContext } from './AZGoalContext'
import type { AZGoalContextInitializer } from './AZGoalContextInitializer'
import type { AZGoalContextStack } from './AZGoalContextStack'
import type { AZStateStack } from './AZStateStack'
import type { AZGoalStateRegistry } from './AZGoalStateRegistry'
import type { AZGoalStructuralStateRegistry } from './AZGoalStructuralStateRegistry'
import type { AZImpasseStateRegistry } from './AZImpasseStateRegistry'

export class AZLowerContextCreator {
  public constructor(
    private readonly symbolManager:
      AZSymbolManager,

    private readonly predefinedSymbols:
      AZPredefinedSymbols,

    private readonly workingMemory:
      AZWorkingMemory,

    private readonly contextStack:
      AZGoalContextStack,

    private readonly stateStack:
      AZStateStack,

    private readonly goalContextInitializer:
      AZGoalContextInitializer,

    private readonly goalStateRegistry:
      AZGoalStateRegistry,

    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,

    private readonly impasseRegistry:
      AZImpasseStateRegistry,
  ) {}

  public create(
    parent: AZGoalContext,
    attributeOfImpasse: AZSymbol,
    impasseType: AZImpasseType,
  ): AZGoalContext {
    if (
      impasseType === 'NONE' ||
      impasseType === 'ONC' ||
      impasseType === 'SNC'
    ) {
      throw new Error(
        'Lower context requires a decision impasse',
      )
    }

    if (
      this.contextStack.findByGoal(
        parent.goal,
      ) !== parent
    ) {
      throw new Error(
        'Parent context does not belong to the goal stack',
      )
    }

    const parentLevel =
      this.goalStateRegistry.getLevel(
        parent.goal,
      )

    const goal =
      this.symbolManager.makeIdentifier('S')

    this.goalContextInitializer.initialize(
      goal,
      parentLevel + 1,
    )

    this.impasseRegistry.registerImpasse(goal)

    const structuralState =
      this.structuralRegistry.get(goal)

    structuralState.impasseType =
      impasseType === 'NO_CHANGE'
        ? 'ONC'
        : impasseType

    structuralState.impasseAttribute =
      attributeOfImpasse

    const description =
      this.describeImpasse(impasseType)

    const wmes = [
      this.workingMemory.createElement(
        goal,
        this.predefinedSymbols.type,
        this.predefinedSymbols.state,
      ),
      this.workingMemory.createElement(
        goal,
        this.predefinedSymbols.superstate,
        parent.goal,
      ),
      this.workingMemory.createElement(
        goal,
        this.predefinedSymbols.attribute,
        attributeOfImpasse,
      ),
      this.workingMemory.createElement(
        goal,
        this.predefinedSymbols.impasse,
        description.impasse,
      ),
      this.workingMemory.createElement(
        goal,
        this.predefinedSymbols.choices,
        description.choices,
      ),
      this.workingMemory.createElement(
        goal,
        this.predefinedSymbols.quiescence,
        this.predefinedSymbols.t,
      ),
    ]

    structuralState.impasseWmes.push(
      ...wmes,
    )

    for (const wme of wmes) {
      this.workingMemory.scheduleAdd(wme)
    }

    const parentState =
      this.stateStack.findByGoal(parent.goal)

    if (parentState === null) {
      throw new Error(
        'Parent goal does not belong to the state stack',
      )
    }

    const context =
      this.contextStack.appendLower(
        parent,
        goal,
      )

    this.stateStack.appendLower(
      parentState,
      {},
      goal,
    )

    return context
  }

  private describeImpasse(
    type: AZImpasseType,
  ): {
    readonly impasse: AZSymbol
    readonly choices: AZSymbol
  } {
    switch (type) {
      case 'CONSTRAINT_FAILURE':
        return {
          impasse:
            this.predefinedSymbols
              .constraintFailure,
          choices:
            this.predefinedSymbols.none,
        }

      case 'CONFLICT':
        return {
          impasse:
            this.predefinedSymbols.conflict,
          choices:
            this.predefinedSymbols.multiple,
        }

      case 'TIE':
        return {
          impasse:
            this.predefinedSymbols.tie,
          choices:
            this.predefinedSymbols.multiple,
        }

      case 'NO_CHANGE':
        return {
          impasse:
            this.predefinedSymbols.noChange,
          choices:
            this.predefinedSymbols.none,
        }

      default:
        throw new Error(
          'Unsupported lower-context impasse type',
        )
    }
  }
}
