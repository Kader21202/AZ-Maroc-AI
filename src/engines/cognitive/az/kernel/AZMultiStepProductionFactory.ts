import type {
  AZIdentifierSymbol,
  AZProduction,
  AZPredefinedSymbols,
  AZSymbolManager,
} from './AZKernelPrimitives'

export interface AZMultiStepProductionFactory {
  createProposalProductions():
    readonly AZProduction[]

  createApplicationProductions(
    outputLinkIdentifier:
      AZIdentifierSymbol,
  ): readonly AZProduction[]
}

export interface AZMultiStepProductionFactoryDependencies {
  readonly symbols: AZSymbolManager
  readonly predefinedSymbols:
    AZPredefinedSymbols
}
