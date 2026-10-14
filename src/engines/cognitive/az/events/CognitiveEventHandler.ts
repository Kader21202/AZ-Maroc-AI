import type { CognitiveEvent } from './CognitiveEvent'

export interface CognitiveEventHandler {
  handle(
    event: CognitiveEvent,
  ): void
}
