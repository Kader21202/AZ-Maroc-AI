import type {
  AZIdentifierSymbol,
  AZProduction,
  AZSymbol,
} from './AZKernelPrimitives'
import type {
  AZMultiStepProductionFactory,
  AZMultiStepProductionFactoryDependencies,
} from './AZMultiStepProductionFactory'

export class DefaultAZVerifiedMultiStepProductionFactory
  implements AZMultiStepProductionFactory
{
  private readonly stateVariable: AZSymbol
  private readonly ioHeaderVariable: AZSymbol
  private readonly inputLinkVariable: AZSymbol
  private readonly expectedQuestion: AZSymbol
  private readonly questionAttribute: AZSymbol
  private readonly operatorValue: AZIdentifierSymbol
  private readonly secondOperatorValue: AZIdentifierSymbol
  private readonly thirdOperatorValue: AZIdentifierSymbol
  private readonly stageAttribute: AZSymbol
  private readonly analyzedStageValue: AZSymbol
  private readonly verificationAttribute: AZSymbol
  private readonly verifiedValue: AZSymbol
  private readonly resultAttribute: AZSymbol
  private readonly resultValue: AZSymbol

  public constructor(
    private readonly dependencies:
      AZMultiStepProductionFactoryDependencies,
  ) {
    const { symbols } = dependencies

    this.stateVariable =
      symbols.makeVariable('s')

    this.ioHeaderVariable =
      symbols.makeVariable('io')

    this.inputLinkVariable =
      symbols.makeVariable('il')

    this.expectedQuestion =
      symbols.makeStringConstant(
        'Quel est le statut de la plateforme ?',
      )

    this.questionAttribute =
      symbols.makeStringConstant(
        'question',
      )

    this.operatorValue =
      symbols.makeIdentifier('')

    this.secondOperatorValue =
      symbols.makeIdentifier('')

    this.thirdOperatorValue =
      symbols.makeIdentifier('')

    this.stageAttribute =
      symbols.makeStringConstant(
        'stage',
      )

    this.analyzedStageValue =
      symbols.makeStringConstant(
        'analyzed',
      )

    this.verificationAttribute =
      symbols.makeStringConstant(
        'verification',
      )

    this.verifiedValue =
      symbols.makeStringConstant(
        'verified',
      )

    this.resultAttribute =
      symbols.makeStringConstant(
        'result',
      )

    this.resultValue =
      symbols.makeStringConstant(
        'AZ-Maroc-AI completed the cognitive application cycle.',
      )
  }

  public createProposalProductions():
    readonly AZProduction[] {
    const {
      predefinedSymbols,
    } = this.dependencies

    return [
      {
        name:
          'az-question-operator-proposal',
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
                this.questionAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.expectedQuestion,
            },
            acceptable: false,
          },
          {
            type: 'NEGATIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.stateVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                this.stageAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.analyzedStageValue,
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
      {
        name:
          'az-stage-verification-operator-proposal',
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
                this.stageAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.analyzedStageValue,
            },
            acceptable: false,
          },
          {
            type: 'NEGATIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.stateVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                this.verificationAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.verifiedValue,
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
                this.secondOperatorValue,
            },
            support: 'UNKNOWN',
          },
        ],
      },
      {
        name:
          'az-verified-third-operator-proposal',
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
                this.verificationAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.verifiedValue,
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
                this.thirdOperatorValue,
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
          'az-operator-stage-application',
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
                this.stageAttribute,
            },
            value: {
              type: 'SYMBOL',
              symbol:
                this.analyzedStageValue,
            },
            support: 'UNKNOWN',
          },
        ],
      },
      {
        name:
          'az-second-operator-verification-application',
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
                this.secondOperatorValue,
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
                this.verificationAttribute,
            },
            value: {
              type: 'SYMBOL',
              symbol:
                this.verifiedValue,
            },
            support: 'UNKNOWN',
          },
        ],
      },
      {
        name:
          'az-third-operator-result-application',
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
                this.thirdOperatorValue,
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
                this.resultValue,
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
              arguments: [
                {
                  type: 'SYMBOL',
                  symbol:
                    symbols.makeStringConstant(
                      'Cognitive result produced.',
                    ),
                },
              ],
            },
          },
        ],
      },
    ]
  }
}




