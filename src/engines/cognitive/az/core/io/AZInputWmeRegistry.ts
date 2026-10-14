import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'

export class AZInputWmeRegistry {
  private readonly inputWmes =
    new Map<string, AZWorkingMemoryElement[]>()

  public add(
    identifier: AZSymbol,
    wme: AZWorkingMemoryElement,
  ): void {
    const existing =
      this.inputWmes.get(identifier.id)

    if (existing === undefined) {
      this.inputWmes.set(
        identifier.id,
        [wme],
      )

      return
    }

    existing.unshift(wme)
  }

  public remove(
    identifier: AZSymbol,
    wme: AZWorkingMemoryElement,
  ): boolean {
    const existing =
      this.inputWmes.get(identifier.id)

    if (existing === undefined) {
      return false
    }

    const index =
      existing.indexOf(wme)

    if (index < 0) {
      return false
    }

    existing.splice(index, 1)

    if (existing.length === 0) {
      this.inputWmes.delete(
        identifier.id,
      )
    }

    return true
  }

  public get(
    identifier: AZSymbol,
  ): readonly AZWorkingMemoryElement[] {
    return this.inputWmes.get(
      identifier.id,
    ) ?? []
  }
}
