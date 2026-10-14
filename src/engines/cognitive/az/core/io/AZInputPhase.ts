import type { AZIoState } from './AZIoState'
import type { AZInputPhaseEventHandler } from './AZInputPhaseEventHandler'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZStateStack } from '../state/AZStateStack'

export class AZInputPhase {
  public constructor(
    private readonly stateStack:
      AZStateStack,

    private readonly ioState:
      AZIoState,

    private readonly workingMemory:
      AZWorkingMemory,

    private readonly eventHandler:
      AZInputPhaseEventHandler,
  ) {}

  public execute(): void {
    const previousTop =
      this.ioState.previousTopState

    const currentTop =
      this.stateStack.top

    if (
      previousTop !== null &&
      previousTop !== currentTop
    ) {
      this.eventHandler.handle(
        'TOP_STATE_JUST_REMOVED',
      )
    }

    if (
      currentTop !== null &&
      currentTop !== previousTop
    ) {
      this.eventHandler.handle(
        'TOP_STATE_JUST_CREATED',
      )
    }

    if (currentTop !== null) {
      this.eventHandler.handle(
        'NORMAL_INPUT_CYCLE',
      )
    }

    this.workingMemory
      .applyBufferedChanges()

    this.ioState.previousTopState =
      currentTop

    this.ioState.outputLinkChanged =
      false
  }
}
