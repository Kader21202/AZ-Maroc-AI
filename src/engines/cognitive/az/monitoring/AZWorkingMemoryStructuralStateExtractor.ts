import type { AZWorkingMemory } from '../core/memory/AZWorkingMemory'
import type { AZWorkingMemoryElement } from '../core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../core/symbols/AZSymbol'
import type {
  StructuralStateObservation,
  StructuralStateSymbolObservation,
} from './StructuralStateObservation'

export class AZWorkingMemoryStructuralStateExtractor {
  public extract(
    workingMemory: AZWorkingMemory,
  ): StructuralStateObservation {
    return {
      elements:
        workingMemory
          .getElements()
          .map(element => ({
            identifier:
              this.observeSymbol(
                element.identifier,
              ),
            attribute:
              this.observeSymbol(
                element.attribute,
              ),
            value:
              this.observeSymbol(
                element.value,
              ),
            acceptable:
              element.acceptable,
          })),
    }
  }

  public observeElement(
    element: AZWorkingMemoryElement,
  ): StructuralStateObservation['elements'][number] {
    return {
      identifier:
        this.observeSymbol(
          element.identifier,
        ),
      attribute:
        this.observeSymbol(
          element.attribute,
        ),
      value:
        this.observeSymbol(
          element.value,
        ),
      acceptable:
        element.acceptable,
    }
  }

  public observeSymbol(
    symbol: AZSymbol,
  ): StructuralStateSymbolObservation {
    if (symbol.type === 'IDENTIFIER') {
      return {
        type: 'IDENTIFIER',
        technicalId: symbol.id,
      }
    }

    return {
      type: symbol.type,
      value: symbol.value,
    }
  }
}
