import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZMatchAssertionType } from './AZMatchSet'

export interface AZRhsInstantiationContext {
  readonly unboundVariableBindings:
    Map<number, AZSymbol>

  readonly assertionType?:
    AZMatchAssertionType
}
