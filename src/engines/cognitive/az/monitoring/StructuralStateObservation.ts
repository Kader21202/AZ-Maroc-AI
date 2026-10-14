export type StructuralStateSymbolObservation =
  | {
      readonly type: 'IDENTIFIER'
      readonly technicalId: string
    }
  | {
      readonly type:
        | 'VARIABLE'
        | 'STRING_CONSTANT'
        | 'INTEGER_CONSTANT'
        | 'FLOAT_CONSTANT'
      readonly value: string | number | null
    }

export interface StructuralStateElementObservation {
  readonly identifier:
    StructuralStateSymbolObservation

  readonly attribute:
    StructuralStateSymbolObservation

  readonly value:
    StructuralStateSymbolObservation

  readonly acceptable: boolean
}

export interface StructuralStateObservation {
  readonly elements:
    readonly StructuralStateElementObservation[]
}
