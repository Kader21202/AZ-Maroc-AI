import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZOutputLink } from './AZOutputLink'

export class AZOutputLinkTransitiveClosureCalculator {
  public calculate(
    outputLink: AZOutputLink,
    workingMemory: AZWorkingMemory,
  ): readonly AZSymbol[] {
    const root =
      outputLink.linkWme.value

    if (root.type !== 'IDENTIFIER') {
      return []
    }

    const identifiers: AZSymbol[] = []
    const visited = new Set<AZSymbol>()
    const pending: AZSymbol[] = [root]

    const elements =
      workingMemory.getElements()

    while (pending.length > 0) {
      const identifier =
        pending.shift()

      if (
        identifier === undefined ||
        visited.has(identifier)
      ) {
        continue
      }

      visited.add(identifier)
      identifiers.push(identifier)

      for (const wme of elements) {
        if (
          wme.identifier !== identifier ||
          wme.value.type !== 'IDENTIFIER'
        ) {
          continue
        }

        if (!visited.has(wme.value)) {
          pending.push(wme.value)
        }
      }
    }

    return identifiers
  }
}
