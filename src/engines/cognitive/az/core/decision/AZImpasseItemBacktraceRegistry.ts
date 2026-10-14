import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreference } from '../operator/AZPreference'
import type { AZWmeCausalProvenanceRegistry } from '../AZWmeCausalProvenanceRegistry'

export class AZImpasseItemBacktraceRegistry {
  private readonly preferences =
    new Map<
      AZWorkingMemoryElement,
      AZPreference
    >()

  public constructor(
    private readonly causalProvenanceRegistry?:
      AZWmeCausalProvenanceRegistry,
  ) {}

  public set(
    wme: AZWorkingMemoryElement,
    preference: AZPreference,
  ): void {
    this.preferences.set(
      wme,
      preference,
    )

    this.causalProvenanceRegistry?.capture(
      wme,
      preference.instantiation,
    )
  }

  public get(
    wme: AZWorkingMemoryElement,
  ): AZPreference | null {
    return (
      this.preferences.get(wme) ??
      null
    )
  }

  public has(
    wme: AZWorkingMemoryElement,
  ): boolean {
    return this.preferences.has(wme)
  }

  public remove(
    wme: AZWorkingMemoryElement,
  ): void {
    this.preferences.delete(wme)
  }
}
