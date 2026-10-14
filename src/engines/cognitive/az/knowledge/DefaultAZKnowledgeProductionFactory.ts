import type {
  AZKnowledgeProductionFactory,
  AZKnowledgeProductionFactoryDependencies,
} from './AZKnowledgeProductionFactory'
import type {
  AZIdentifierSymbol,
  AZProduction,
  AZSymbol,
} from '../kernel/AZKernelPrimitives'

export class DefaultAZKnowledgeProductionFactory
  implements AZKnowledgeProductionFactory
{
  private readonly stateVariable: AZSymbol
  private readonly ioHeaderVariable: AZSymbol
  private readonly inputLinkVariable: AZSymbol
  private readonly knowledgeValueVariable: AZSymbol
  private readonly knowledgeResultAttribute: AZSymbol
  private readonly resultAttribute: AZSymbol
  private readonly operatorValue: AZIdentifierSymbol

  public constructor(
    private readonly dependencies:
      AZKnowledgeProductionFactoryDependencies,
  ) {
    const { symbols } = dependencies

    this.stateVariable =
      symbols.makeVariable('s')

    this.ioHeaderVariable =
      symbols.makeVariable('io')

    this.inputLinkVariable =
      symbols.makeVariable('il')

    this.knowledgeValueVariable =
      symbols.makeVariable('knowledge')

    this.knowledgeResultAttribute =
      symbols.makeStringConstant(
        'knowledge-result',
      )

    this.resultAttribute =
      symbols.makeStringConstant(
        'result',
      )

    this.operatorValue =
      symbols.makeIdentifier('')
  }

  public createProposalProductions():
    readonly AZProduction[] {
    const {
      predefinedSymbols,
    } = this.dependencies

    return [
      {
        name:
          'az-knowledge-result-operator-proposal',
        declaredSupport: 'I_SUPPORT',
        conditions: [
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.stateVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                predefinedSymbols.io,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.ioHeaderVariable,
            },
            acceptable: false,
          },
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.ioHeaderVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                predefinedSymbols.inputLink,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.inputLinkVariable,
            },
            acceptable: false,
          },
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.inputLinkVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                this.knowledgeResultAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.knowledgeValueVariable,
            },
            acceptable: false,
          },
        ],
        actions: [
          {
            type: 'MAKE',
            preferenceType:
              'ACCEPTABLE',
            identifier: {
              type: 'SYMBOL',
              symbol:
                this.stateVariable,
            },
            attribute: {
              type: 'SYMBOL',
              symbol:
                predefinedSymbols.operator,
            },
            value: {
              type: 'SYMBOL',
              symbol:
                this.operatorValue,
            },
            support: 'UNKNOWN',
          },
        ],
      },
    ]
  }

  public createApplicationProductions(
    outputLinkIdentifier:
      AZIdentifierSymbol,
  ): readonly AZProduction[] {
    const {
      symbols,
      predefinedSymbols,
    } = this.dependencies

    return [
      {
        name:
          'az-knowledge-result-application',
        declaredSupport: 'O_SUPPORT',
        conditions: [
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.stateVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                predefinedSymbols.operator,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.operatorValue,
            },
            acceptable: false,
          },
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.stateVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                predefinedSymbols.io,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.ioHeaderVariable,
            },
            acceptable: false,
          },
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.ioHeaderVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                predefinedSymbols.inputLink,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.inputLinkVariable,
            },
            acceptable: false,
          },
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.inputLinkVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                this.knowledgeResultAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.knowledgeValueVariable,
            },
            acceptable: false,
          },
        ],
        actions: [
          {
            type: 'MAKE',
            preferenceType:
              'ACCEPTABLE',
            identifier: {
              type: 'SYMBOL',
              symbol:
                outputLinkIdentifier,
            },
            attribute: {
              type: 'SYMBOL',
              symbol:
                this.resultAttribute,
            },
            value: {
              type: 'SYMBOL',
              symbol:
                this.knowledgeValueVariable,
            },
            support: 'UNKNOWN',
          },
          {
            type: 'FUNCALL',
            functionCall: {
              type: 'FUNCALL',
              functionName:
                symbols.makeStringConstant(
                  'halt',
                ),
              arguments: [],
            },
          },
        ],
      },
    ]
  }
}


