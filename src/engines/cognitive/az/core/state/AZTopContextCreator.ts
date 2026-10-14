import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'
import type { AZGoalContext } from './AZGoalContext'
import type { AZGoalContextStack } from './AZGoalContextStack'
import type { AZStateStack } from './AZStateStack'
import type { AZGoalContextInitializer } from './AZGoalContextInitializer'
import type { AZGoalStructuralStateRegistry } from './AZGoalStructuralStateRegistry'

export class AZTopContextCreator {
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

    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,
  ) {}

  public create(): AZGoalContext {
    if (this.contextStack.top !== null) {
      throw new Error(
        'Top goal context already exists',
      )
    }

    const goal: AZSymbol =
      this.symbolManager.makeIdentifier('S')

    this.goalContextInitializer.initialize(
      goal,
      1,
    )

    const typeWme =
      this.workingMemory.createElement(
        goal,
        this.predefinedSymbols.type,
        this.predefinedSymbols.state,
      )

    const superstateWme =
      this.workingMemory.createElement(
        goal,
        this.predefinedSymbols.superstate,
        this.predefinedSymbols.nil,
      )

    const structuralState =
      this.structuralRegistry.get(goal)

    structuralState.impasseWmes.push(
      typeWme,
      superstateWme,
    )

    this.workingMemory.scheduleAdd(typeWme)
    this.workingMemory.scheduleAdd(superstateWme)

    const context =
      this.contextStack.setTop(goal)

    this.stateStack.setTop({}, goal)

    return context
  }
}
