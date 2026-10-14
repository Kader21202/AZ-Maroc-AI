export type PersistentMemoryValue =
  | {
      readonly type: 'IDENTIFIER'
      readonly reference: string
    }
  | {
      readonly type: 'STRING_CONSTANT'
      readonly value: string
    }
  | {
      readonly type: 'INTEGER_CONSTANT'
      readonly value: number
    }
  | {
      readonly type: 'FLOAT_CONSTANT'
      readonly value: number
    }

export interface PersistentMemoryElement {
  readonly identifier: string
  readonly attribute: PersistentMemoryValue
  readonly value: PersistentMemoryValue
  readonly acceptable: boolean
}

export interface PersistentContinuationMemory {
  readonly root: string
  readonly elements:
    readonly PersistentMemoryElement[]
}
