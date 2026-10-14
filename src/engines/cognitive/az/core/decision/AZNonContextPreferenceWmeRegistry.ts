import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreference } from '../operator/AZPreference'
import type { AZWmeCausalProvenanceRegistry } from '../AZWmeCausalProvenanceRegistry'

export class AZNonContextPreferenceWmeRegistry {
  private readonly associations =
    new Map<
      AZWorkingMemoryElement,
      AZPreference | null
    >()

  public constructor(
    private readonly causalProvenanceRegistry?:
      AZWmeCausalProvenanceRegistry,
  ) {}

  public set(
    wme: AZWorkingMemoryElement,
    preference: AZPreference | null,
  ): void {
    this.associations.set(
      wme,
      preference,
    )

    this.causalProvenanceRegistry?.capture(
      wme,
      preference?.instantiation ?? null,
    )
  }

  public get(
    wme: AZWorkingMemoryElement,
  ): AZPreference | null {
    return (
      this.associations.get(wme) ??
      null
    )
  }

  public remove(
    wme: AZWorkingMemoryElement,
  ): void {
    this.associations.delete(wme)
  }
}
