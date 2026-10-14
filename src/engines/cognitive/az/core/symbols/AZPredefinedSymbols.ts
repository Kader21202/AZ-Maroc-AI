import type { AZSymbol } from './AZSymbol'
import { AZSymbolManager } from './AZSymbolManager'

export class AZPredefinedSymbols {
  public readonly io: AZSymbol
  public readonly inputLink: AZSymbol
  public readonly outputLink: AZSymbol
  public readonly operator: AZSymbol

  public readonly type: AZSymbol
  public readonly state: AZSymbol
  public readonly superstate: AZSymbol
  public readonly attribute: AZSymbol
  public readonly impasse: AZSymbol
  public readonly choices: AZSymbol
  public readonly quiescence: AZSymbol
  public readonly item: AZSymbol
  public readonly itemCount: AZSymbol
  public readonly nonNumeric: AZSymbol
  public readonly nonNumericCount: AZSymbol

  public readonly none: AZSymbol
  public readonly noChange: AZSymbol
  public readonly tie: AZSymbol
  public readonly conflict: AZSymbol
  public readonly constraintFailure: AZSymbol

  public readonly multiple: AZSymbol
  public readonly t: AZSymbol
  public readonly nil: AZSymbol

  public constructor(
    symbolManager: AZSymbolManager,
  ) {
    this.io =
      symbolManager.makeStringConstant('io')

    this.inputLink =
      symbolManager.makeStringConstant('input-link')

    this.outputLink =
      symbolManager.makeStringConstant('output-link')

    this.operator =
      symbolManager.makeStringConstant('operator')

    this.type =
      symbolManager.makeStringConstant('type')

    this.state =
      symbolManager.makeStringConstant('state')

    this.superstate =
      symbolManager.makeStringConstant('superstate')

    this.attribute =
      symbolManager.makeStringConstant('attribute')

    this.impasse =
      symbolManager.makeStringConstant('impasse')

    this.choices =
      symbolManager.makeStringConstant('choices')

    this.quiescence =
      symbolManager.makeStringConstant('quiescence')

    this.item =
      symbolManager.makeStringConstant('item')

    this.itemCount =
      symbolManager.makeStringConstant('item-count')

    this.nonNumeric =
      symbolManager.makeStringConstant('non-numeric')

    this.nonNumericCount =
      symbolManager.makeStringConstant('non-numeric-count')

    this.none =
      symbolManager.makeStringConstant('none')

    this.noChange =
      symbolManager.makeStringConstant('no-change')

    this.tie =
      symbolManager.makeStringConstant('tie')

    this.conflict =
      symbolManager.makeStringConstant('conflict')

    this.constraintFailure =
      symbolManager.makeStringConstant('constraint-failure')

    this.multiple =
      symbolManager.makeStringConstant('multiple')

    this.t =
      symbolManager.makeStringConstant('t')

    this.nil =
      symbolManager.makeStringConstant('nil')
  }
}


