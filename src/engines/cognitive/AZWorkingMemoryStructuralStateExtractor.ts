import type {
  StructuralStateObservation,
  StructuralStateSymbolObservation,
} from './az/monitoring/StructuralStateObservation'

interface StructuralStateSourceSymbol {
  readonly id: string
  readonly type:
    | 'IDENTIFIER'
    | 'VARIABLE'
    | 'STRING_CONSTANT'
    | 'INTEGER_CONSTANT'
    | 'FLOAT_CONSTANT'
  readonly value: string | number | null
}

interface StructuralStateSourceElement {
  readonly identifier:
    StructuralStateSourceSymbol

  readonly attribute:
    StructuralStateSourceSymbol

  readonly value:
    StructuralStateSourceSymbol

  readonly acceptable: boolean
}

interface StructuralStateWorkingMemoryView {
  getElements():
    readonly StructuralStateSourceElement[]
}

export class AZWorkingMemoryStructuralStateExtractor {
  public extract(
    workingMemory:
      StructuralStateWorkingMemoryView,
  ): StructuralStateObservation {
    return {
      elements:
        workingMemory
          .getElements()
          .map((element) => ({
            identifier:
              this.extractSymbol(
                element.identifier,
              ),
            attribute:
              this.extractSymbol(
                element.attribute,
              ),
            value:
              this.extractSymbol(
                element.value,
              ),
            acceptable:
              element.acceptable,
          })),
    }
  }

  private extractSymbol(
    symbol: StructuralStateSourceSymbol,
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
