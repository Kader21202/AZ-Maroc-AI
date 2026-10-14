import type {
  AZIdentifierSymbol,
  AZProduction,
  AZPredefinedSymbols,
  AZSymbolManager,
} from '../kernel/AZKernelPrimitives'

export interface AZKnowledgeProductionFactory {
  createProposalProductions():
    readonly AZProduction[]

  createApplicationProductions(
    outputLinkIdentifier:
      AZIdentifierSymbol,
  ): readonly AZProduction[]
}

export interface AZKnowledgeProductionFactoryDependencies {
  readonly symbols: AZSymbolManager
  readonly predefinedSymbols:
    AZPredefinedSymbols
}
