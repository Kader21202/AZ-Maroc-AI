import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZInputWmeRegistry } from './AZInputWmeRegistry'

export class AZInputWmeManager {
  public constructor(
    private readonly workingMemory:
      AZWorkingMemory,

    private readonly registry:
      AZInputWmeRegistry,
  ) {}

  public add(
    identifier: AZSymbol,
    attribute: AZSymbol,
    value: AZSymbol,
  ): AZWorkingMemoryElement {
    if (
      identifier.type !==
      'IDENTIFIER'
    ) {
      throw new Error(
        'AZ input WME identifier must be an identifier',
      )
    }

    const wme =
      this.workingMemory.createElement(
        identifier,
        attribute,
        value,
        false,
      )

    this.registry.add(
      identifier,
      wme,
    )

    this.workingMemory.scheduleAdd(
      wme,
    )

    return wme
  }

  public remove(
    wme: AZWorkingMemoryElement,
  ): boolean {
    if (
      wme.identifier.type !==
      'IDENTIFIER'
    ) {
      return false
    }

    if (
      !this.registry.remove(
        wme.identifier,
        wme,
      )
    ) {
      return false
    }

    this.workingMemory.scheduleRemove(
      wme,
    )

    return true
  }
}
