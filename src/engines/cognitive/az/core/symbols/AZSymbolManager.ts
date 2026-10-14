import type { AZSymbol } from './AZSymbol'

export class AZSymbolManager {
  private readonly variables =
    new Map<string, AZSymbol>()

  private readonly stringConstants =
    new Map<string, AZSymbol>()

  private readonly integerConstants =
    new Map<number, AZSymbol>()

  private readonly floatConstants =
    new Map<number, AZSymbol>()

  private nextSymbolId = 1
  private nextIdentifierNumber = 1
  private currentSymbolHashId = 0

  public makeVariable(
    name: string,
  ): AZSymbol {
    const existing =
      this.variables.get(name)

    if (existing !== undefined) {
      return existing
    }

    const symbol =
      this.createSymbol(
        'VARIABLE',
        name,
      )

    this.variables.set(name, symbol)

    return symbol
  }

  public makeStringConstant(
    value: string,
  ): AZSymbol {
    const existing =
      this.stringConstants.get(value)

    if (existing !== undefined) {
      return existing
    }

    const symbol =
      this.createSymbol(
        'STRING_CONSTANT',
        value,
      )

    this.stringConstants.set(
      value,
      symbol,
    )

    return symbol
  }

  public makeIntegerConstant(
    value: number,
  ): AZSymbol {
    const existing =
      this.integerConstants.get(value)

    if (existing !== undefined) {
      return existing
    }

    const symbol =
      this.createSymbol(
        'INTEGER_CONSTANT',
        value,
      )

    this.integerConstants.set(
      value,
      symbol,
    )

    return symbol
  }

  public makeFloatConstant(
    value: number,
  ): AZSymbol {
    const existing =
      this.floatConstants.get(value)

    if (existing !== undefined) {
      return existing
    }

    const symbol =
      this.createSymbol(
        'FLOAT_CONSTANT',
        value,
      )

    this.floatConstants.set(
      value,
      symbol,
    )

    return symbol
  }

  public makeIdentifier(
    prefix = 'I',
  ): AZSymbol {
    const number =
      this.nextIdentifierNumber

    this.nextIdentifierNumber += 1

    return this.createSymbol(
      'IDENTIFIER',
      `${prefix}${number}`,
    )
  }

  private createSymbol(
    type: AZSymbol['type'],
    value: AZSymbol['value'],
  ): AZSymbol {
    return {
      id: this.generateSymbolId(),
      hashId:
        this.generateSymbolHashId(),
      type,
      value,
    }
  }

  private generateSymbolId():
    string {
    const id =
      `az-symbol-${this.nextSymbolId}`

    this.nextSymbolId += 1

    return id
  }

  private generateSymbolHashId():
    number {
    this.currentSymbolHashId += 137

    return this.currentSymbolHashId
  }
}
