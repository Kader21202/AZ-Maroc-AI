import type { AZOutputCommand } from '../core/io/AZOutputCommand'
import type { AZWorkingMemory } from '../core/memory/AZWorkingMemory'
import type { AZSymbol } from '../core/symbols/AZSymbol'
import type {
  PersistentContinuationMemory,
  PersistentMemoryElement,
  PersistentMemoryValue,
} from './PersistentContinuationMemory'

export class PersistentContinuationMemoryExtractor {
  public extract(
    command: AZOutputCommand,
    workingMemory: AZWorkingMemory,
  ): PersistentContinuationMemory {
    if (command.mode === 'REMOVED') {
      throw new Error(
        'Cannot persist a removed AZ output command',
      )
    }

    const root =
      command.outputLink.linkWme.value

    if (root.type !== 'IDENTIFIER') {
      throw new Error(
        'Persistent AZ output root must be an identifier',
      )
    }

    const identifiers =
      command.outputLink.idsInTc

    if (!identifiers.includes(root)) {
      throw new Error(
        'Persistent AZ output root is outside its transitive closure',
      )
    }

    const references =
      new Map<AZSymbol, string>()

    identifiers.forEach(
      (identifier, index) => {
        references.set(
          identifier,
          `m${index}`,
        )
      },
    )

    const elements: PersistentMemoryElement[] = []

    for (
      const wme of
      workingMemory.getElements()
    ) {
      const identifierReference =
        references.get(wme.identifier)

      if (identifierReference === undefined) {
        continue
      }

      elements.push({
        identifier: identifierReference,
        attribute: this.toPersistentValue(
          wme.attribute,
          references,
        ),
        value: this.toPersistentValue(
          wme.value,
          references,
        ),
        acceptable: wme.acceptable,
      })
    }

    const rootReference =
      references.get(root)

    if (rootReference === undefined) {
      throw new Error(
        'Persistent AZ output root has no logical reference',
      )
    }

    return {
      root: rootReference,
      elements,
    }
  }

  private toPersistentValue(
    symbol: AZSymbol,
    references: ReadonlyMap<
      AZSymbol,
      string
    >,
  ): PersistentMemoryValue {
    switch (symbol.type) {
      case 'IDENTIFIER': {
        const reference =
          references.get(symbol)

        if (reference === undefined) {
          throw new Error(
            'Persistent AZ output references an identifier outside its transitive closure',
          )
        }

        return {
          type: 'IDENTIFIER',
          reference,
        }
      }

      case 'STRING_CONSTANT':
        return {
          type: 'STRING_CONSTANT',
          value: symbol.value as string,
        }

      case 'INTEGER_CONSTANT':
        return {
          type: 'INTEGER_CONSTANT',
          value: symbol.value as number,
        }

      case 'FLOAT_CONSTANT':
        return {
          type: 'FLOAT_CONSTANT',
          value: symbol.value as number,
        }

      case 'VARIABLE':
        throw new Error(
          'AZ variables cannot be persisted as continuation-memory values',
        )
    }
  }
}
