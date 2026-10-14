import type { AZInputWmeManager } from '../core/io/AZInputWmeManager'
import type { AZIdentifierLinkStateRegistry } from '../core/state/AZIdentifierLinkStateRegistry'
import type { AZSymbol } from '../core/symbols/AZSymbol'
import type { AZSymbolManager } from '../core/symbols/AZSymbolManager'
import type {
  PersistentContinuationMemory,
  PersistentMemoryValue,
} from './PersistentContinuationMemory'

export class PersistentContinuationMemoryInjector {
  public inject(
    memory: PersistentContinuationMemory,
    inputLink: AZSymbol,
    symbolManager: AZSymbolManager,
    identifierStateRegistry:
      AZIdentifierLinkStateRegistry,
    inputWmeManager: AZInputWmeManager,
  ): AZSymbol {
    if (inputLink.type !== 'IDENTIFIER') {
      throw new Error(
        'Persistent continuation memory requires an AZ input-link identifier',
      )
    }

    const inputLinkState =
      identifierStateRegistry.get(inputLink)

    const identifiers =
      new Map<string, AZSymbol>()

    const references =
      this.collectReferences(memory)

    for (const reference of references) {
      const identifier =
        symbolManager.makeIdentifier('I')

      identifierStateRegistry.register(
        identifier,
        {
          level: inputLinkState.level,
          promotionLevel:
            inputLinkState.promotionLevel,
        },
      )

      identifiers.set(
        reference,
        identifier,
      )
    }

    const root =
      identifiers.get(memory.root)

    if (root === undefined) {
      throw new Error(
        'Persistent continuation memory root is undefined',
      )
    }

    /*
     * Attach the reconstructed graph to the fresh
     * runtime's native input link.
     *
     * The envelope is deliberately external to M:
     * M stores the persisted graph itself, while this
     * attribute defines how that graph re-enters AZ.
     */
    inputWmeManager.add(
      inputLink,
      symbolManager.makeStringConstant(
        'persistent-memory',
      ),
      root,
    )

    for (const element of memory.elements) {
      if (element.acceptable) {
        throw new Error(
          'Acceptable WMEs cannot be reconstructed through the native AZ input interface',
        )
      }

      const identifier =
        identifiers.get(
          element.identifier,
        )

      if (identifier === undefined) {
        throw new Error(
          `Undefined persistent identifier: ${element.identifier}`,
        )
      }

      inputWmeManager.add(
        identifier,
        this.toSymbol(
          element.attribute,
          identifiers,
          symbolManager,
        ),
        this.toSymbol(
          element.value,
          identifiers,
          symbolManager,
        ),
      )
    }

    return root
  }

  private collectReferences(
    memory: PersistentContinuationMemory,
  ): Set<string> {
    const references =
      new Set<string>()

    references.add(memory.root)

    for (const element of memory.elements) {
      references.add(
        element.identifier,
      )

      if (
        element.attribute.type ===
        'IDENTIFIER'
      ) {
        references.add(
          element.attribute.reference,
        )
      }

      if (
        element.value.type ===
        'IDENTIFIER'
      ) {
        references.add(
          element.value.reference,
        )
      }
    }

    return references
  }

  private toSymbol(
    value: PersistentMemoryValue,
    identifiers: ReadonlyMap<
      string,
      AZSymbol
    >,
    symbolManager: AZSymbolManager,
  ): AZSymbol {
    switch (value.type) {
      case 'IDENTIFIER': {
        const identifier =
          identifiers.get(
            value.reference,
          )

        if (identifier === undefined) {
          throw new Error(
            `Undefined persistent identifier reference: ${value.reference}`,
          )
        }

        return identifier
      }

      case 'STRING_CONSTANT':
        return symbolManager
          .makeStringConstant(
            value.value,
          )

      case 'INTEGER_CONSTANT':
        return symbolManager
          .makeIntegerConstant(
            value.value,
          )

      case 'FLOAT_CONSTANT':
        return symbolManager
          .makeFloatConstant(
            value.value,
          )
    }
  }
}
