import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZBufferedLinkChangesProcessor } from './AZBufferedLinkChangesProcessor'

export class AZWorkingMemoryChangesApplier {
  public constructor(
    private readonly bufferedLinkChangesProcessor:
      AZBufferedLinkChangesProcessor,
  ) {}

  public apply(
    preferenceMemory: AZPreferenceMemory,
    workingMemory: AZWorkingMemory,
  ): void {
    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-N before buffered links')
    this.bufferedLinkChangesProcessor
      .process()

    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-O after buffered links / before WM buffered changes')
    workingMemory.applyBufferedChanges()
    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-P after WM buffered changes / before garbage slots')

    preferenceMemory.removeGarbageSlots()
    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-Q after garbage slots')
  }
}
