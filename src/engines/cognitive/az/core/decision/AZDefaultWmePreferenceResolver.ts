import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreference } from '../operator/AZPreference'
import type { AZAcceptablePreferenceWmeRegistry } from '../memory/AZAcceptablePreferenceWmeRegistry'
import type { AZContextPreferenceWmeRegistry } from './AZContextPreferenceWmeRegistry'
import type { AZImpasseItemBacktraceRegistry } from './AZImpasseItemBacktraceRegistry'
import type { AZNonContextPreferenceWmeRegistry } from './AZNonContextPreferenceWmeRegistry'
import type { AZWmePreferenceResolver } from './AZWmePreferenceResolver'

export class AZDefaultWmePreferenceResolver
  implements AZWmePreferenceResolver
{
  public constructor(
    private readonly contextRegistry:
      AZContextPreferenceWmeRegistry,

    private readonly nonContextRegistry:
      AZNonContextPreferenceWmeRegistry,

    private readonly acceptableRegistry:
      AZAcceptablePreferenceWmeRegistry,

    private readonly impasseItemRegistry:
      AZImpasseItemBacktraceRegistry,
  ) {}

  public resolve(
    wme: AZWorkingMemoryElement,
  ): AZPreference | null {
    const candidates = [
      this.contextRegistry.get(wme),
      this.nonContextRegistry.get(wme),
      this.acceptableRegistry.get(wme),
      this.impasseItemRegistry.get(wme),
    ].filter(
      (
        preference,
      ): preference is AZPreference =>
        preference !== null,
    )

    const distinct =
      [...new Set(candidates)]

    if (distinct.length > 1) {
      throw new Error(
        'AZ WME has conflicting preference provenance.',
      )
    }

    return distinct[0] ?? null
  }
}
