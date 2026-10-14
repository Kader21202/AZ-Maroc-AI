import type { AZLinkAdditionProcessor } from '../decision/AZLinkAdditionProcessor'
import type { AZLinkRemovalProcessor } from '../decision/AZLinkRemovalProcessor'
import { AZInputPhase } from './AZInputPhase'
import type { AZInputPhaseEventHandler } from './AZInputPhaseEventHandler'
import { AZInputWmeManager } from './AZInputWmeManager'
import { AZInputWmeRegistry } from './AZInputWmeRegistry'
import { AZIoState } from './AZIoState'
import { AZIoStructureInitializer } from './AZIoStructureInitializer'
import { AZOutputLinkManager } from './AZOutputLinkManager'
import { AZWorkingMemory } from '../memory/AZWorkingMemory'
import { AZOutputPhase } from '../phases/AZOutputPhase'
import type { AZStateStack } from '../state/AZStateStack'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'

export class AZIoRuntime {
  public readonly ioState:
    AZIoState

  public readonly outputLinkManager:
    AZOutputLinkManager

  public readonly workingMemory:
    AZWorkingMemory

  public readonly inputWmeRegistry:
    AZInputWmeRegistry

  public readonly inputWmeManager:
    AZInputWmeManager

  public readonly ioStructureInitializer:
    AZIoStructureInitializer

  public readonly inputPhase:
    AZInputPhase

  public readonly outputPhase:
    AZOutputPhase

  public constructor(
    symbolManager:
      AZSymbolManager,

    predefinedSymbols:
      AZPredefinedSymbols,

    stateStack:
      AZStateStack,


    identifierStateRegistry:
      AZIdentifierLinkStateRegistry,
    inputPhaseEventHandler:
      AZInputPhaseEventHandler,

    linkAdditionProcessor?:
      AZLinkAdditionProcessor,

    linkRemovalProcessor?:
      AZLinkRemovalProcessor,
  ) {
    this.ioState =
      new AZIoState()

    this.outputLinkManager =
      new AZOutputLinkManager(
        this.ioState,
      )

    this.workingMemory =
      new AZWorkingMemory(
        linkAdditionProcessor,
        linkRemovalProcessor,
        this.outputLinkManager,
      )

    this.inputWmeRegistry =
      new AZInputWmeRegistry()

    this.inputWmeManager =
      new AZInputWmeManager(
        this.workingMemory,
        this.inputWmeRegistry,
      )

    this.ioStructureInitializer =
      new AZIoStructureInitializer(
        symbolManager,
        predefinedSymbols,
        this.inputWmeManager,
        identifierStateRegistry,
      )

    this.inputPhase =
      new AZInputPhase(
        stateStack,
        this.ioState,
        this.workingMemory,
        inputPhaseEventHandler,
      )

    this.outputPhase =
      new AZOutputPhase()
  }

  public initialize(
    topGoal: AZSymbol,
  ): void {
    this.ioStructureInitializer.initialize(
      topGoal,
      this.ioState,
    )
  }
}


