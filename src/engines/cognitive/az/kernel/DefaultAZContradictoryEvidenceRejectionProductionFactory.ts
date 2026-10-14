import type {
  AZIdentifierSymbol,
  AZProduction,
  AZSymbol,
} from './AZKernelPrimitives'
import type {
  AZMultiStepProductionFactory,
  AZMultiStepProductionFactoryDependencies,
} from './AZMultiStepProductionFactory'

export class DefaultAZContradictoryEvidenceRejectionProductionFactory
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
  private readonly fourthOperatorValue: AZIdentifierSymbol
  private readonly stageAttribute: AZSymbol
  private readonly analyzedStageValue: AZSymbol
  private readonly evidenceAttribute: AZSymbol
  private readonly evidenceVariable: AZSymbol
  private readonly sourceIdAttribute: AZSymbol
  private readonly sourceIdValue: AZSymbol
  private readonly contentAttribute: AZSymbol
  private readonly contentValue: AZSymbol
  private readonly supportAttribute: AZSymbol
  private readonly supportingEvidenceValue: AZSymbol
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

    this.fourthOperatorValue =
      symbols.makeIdentifier('')

    this.stageAttribute =
      symbols.makeStringConstant(
        'stage',
      )

    this.analyzedStageValue =
      symbols.makeStringConstant(
        'analyzed',
      )

    this.evidenceAttribute =
      symbols.makeStringConstant(
        'evidence',
      )

    this.evidenceVariable =
      symbols.makeVariable('evidence')

    this.sourceIdAttribute =
      symbols.makeStringConstant(
        'source-id',
      )

    this.sourceIdValue =
      symbols.makeStringConstant(
        'az-controlled-source-001',
      )

    this.contentAttribute =
      symbols.makeStringConstant(
        'content',
      )

    this.contentValue =
      symbols.makeStringConstant(
        'AZ controlled supporting evidence',
      )

    this.supportAttribute =
      symbols.makeStringConstant(
        'support',
      )

    this.supportingEvidenceValue =
      symbols.makeStringConstant(
        'contradicts',
      )

    this.verificationAttribute =
      symbols.makeStringConstant(
        'verification',
      )

    this.verifiedValue =
      symbols.makeStringConstant(
        'rejected',
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
          'az-stage-evidence-operator-proposal',
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
                this.evidenceAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.evidenceVariable,
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
          'az-contradictory-evidence-rejection-operator-proposal',
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
                this.evidenceAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.evidenceVariable,
            },
            acceptable: false,
          },
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.evidenceVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                this.sourceIdAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.sourceIdValue,
            },
            acceptable: false,
          },
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.evidenceVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                this.contentAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.contentValue,
            },
            acceptable: false,
          },
          {
            type: 'POSITIVE',
            identifierTest: {
              type: 'EQUALITY',
              referent:
                this.evidenceVariable,
            },
            attributeTest: {
              type: 'EQUALITY',
              referent:
                this.supportAttribute,
            },
            valueTest: {
              type: 'EQUALITY',
              referent:
                this.supportingEvidenceValue,
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
          'az-second-operator-evidence-application',
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
                this.evidenceAttribute,
            },
            value: {
              type: 'UNBOUND_VARIABLE',
              index: 0,
            },
            support: 'UNKNOWN',
          },
          {
            type: 'MAKE',
            preferenceType:
              'ACCEPTABLE',
            identifier: {
              type: 'UNBOUND_VARIABLE',
              index: 0,
            },
            attribute: {
              type: 'SYMBOL',
              symbol:
                this.sourceIdAttribute,
            },
            value: {
              type: 'SYMBOL',
              symbol:
                this.sourceIdValue,
            },
            support: 'UNKNOWN',
          },
          {
            type: 'MAKE',
            preferenceType:
              'ACCEPTABLE',
            identifier: {
              type: 'UNBOUND_VARIABLE',
              index: 0,
            },
            attribute: {
              type: 'SYMBOL',
              symbol:
                this.contentAttribute,
            },
            value: {
              type: 'SYMBOL',
              symbol:
                this.contentValue,
            },
            support: 'UNKNOWN',
          },
          {
            type: 'MAKE',
            preferenceType:
              'ACCEPTABLE',
            identifier: {
              type: 'UNBOUND_VARIABLE',
              index: 0,
            },
            attribute: {
              type: 'SYMBOL',
              symbol:
                this.supportAttribute,
            },
            value: {
              type: 'SYMBOL',
              symbol:
                this.supportingEvidenceValue,
            },
            support: 'UNKNOWN',
          },
        ],
      },
      {
        name:
          'az-third-operator-rejection-application',
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
          'az-fourth-operator-result-application',
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
                this.fourthOperatorValue,
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


