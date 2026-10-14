import type { AZNonContextSlotsDecider } from '../decision/AZNonContextSlotDecider'
import type { AZWorkingMemoryChangesApplier } from '../decision/AZWorkingMemoryChangesApplier'
import type {
  AZAcceptablePreferenceWmeChangesProcessor,
  AZAcceptablePreferenceWmeSynchronizer,
} from '../memory/AZAcceptablePreferenceWmeSynchronizer'
import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZMatchSet } from '../production/AZMatchSet'

export class AZWorkingMemoryPhase {
  public constructor(
    private readonly preferenceMemory:
      AZPreferenceMemory,

    private readonly workingMemory:
      AZWorkingMemory,

    private readonly acceptablePreferenceWmeChangesProcessor:
      AZAcceptablePreferenceWmeChangesProcessor,

    private readonly acceptablePreferenceWmeSynchronizer:
      AZAcceptablePreferenceWmeSynchronizer,

    private readonly nonContextSlotsDecider:
      AZNonContextSlotsDecider,

    private readonly workingMemoryChangesApplier:
      AZWorkingMemoryChangesApplier,
  ) {}

  public execute(
    matchSet: AZMatchSet,
  ): void {
    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-J before acceptable processAll')
    this.acceptablePreferenceWmeChangesProcessor
      .processAll(
        this.preferenceMemory,
        this.workingMemory,
        this.acceptablePreferenceWmeSynchronizer,
      )

    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-K after acceptable / before nonContext')
    this.nonContextSlotsDecider
      .decideAll(
        this.preferenceMemory,
        this.workingMemory,
      )

    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-L after nonContext / before WM apply')
    this.workingMemoryChangesApplier
      .apply(
        this.preferenceMemory,
        this.workingMemory,
      )
  }
}
