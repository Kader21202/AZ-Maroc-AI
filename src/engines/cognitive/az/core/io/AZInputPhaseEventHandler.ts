import type { AZInputPhaseEvent } from './AZInputPhaseEvent'

export interface AZInputPhaseEventHandler {
  handle(event: AZInputPhaseEvent): void
}

export type AZNormalInputCycleCallback =
  () => void

export class AZDefaultInputPhaseEventHandler
  implements AZInputPhaseEventHandler
{
  public constructor(
    private readonly onNormalInputCycle?:
      AZNormalInputCycleCallback,
  ) {}

  public handle(
    event: AZInputPhaseEvent,
  ): void {
    if (event !== 'NORMAL_INPUT_CYCLE') {
      return
    }

    this.onNormalInputCycle?.()
  }
}
