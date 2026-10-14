import type { AZSymbol } from '../core/symbols/AZSymbol'

export type { AZProductionDescriptor as AZProduction } from '../core/production/AZProductionDescriptor'

export { AZPredefinedSymbols } from '../core/symbols/AZPredefinedSymbols'

export type { AZSymbol, AZSymbol as AZIdentifierSymbol } from '../core/symbols/AZSymbol'

export interface AZSymbolManager {
  makeVariable(name: string): AZSymbol
  makeStringConstant(value: string): AZSymbol
  makeIntegerConstant(value: number): AZSymbol
  makeFloatConstant(value: number): AZSymbol
  makeIdentifier(prefix?: string): AZSymbol
}


