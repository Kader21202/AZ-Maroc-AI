import type { AZWorkingMemoryElement } from './memory/AZWorkingMemoryElement'
import type { AZInstantiation } from './production/AZInstantiation'

export class AZWmeCausalProvenanceRegistry {
  private readonly associations =
    new WeakMap<
      AZWorkingMemoryElement,
      AZInstantiation | null
    >()

  public capture(
    wme: AZWorkingMemoryElement,
    producerInstantiation:
      AZInstantiation | null,
  ): void {
    if (this.associations.has(wme)) {
      return
    }

    this.associations.set(
      wme,
      producerInstantiation,
    )
  }

  public resolve(
    wme: AZWorkingMemoryElement,
  ): AZInstantiation | null {
    return (
      this.associations.get(wme) ??
      null
    )
  }
}

