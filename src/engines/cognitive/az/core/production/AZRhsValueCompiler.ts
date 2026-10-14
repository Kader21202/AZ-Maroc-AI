import type { AZProductionRhsValue } from './AZProductionRhsValue'
import type { AZVariableBindingManager } from './AZVariableBindingManager'

export interface AZRhsCompilationContext {
  readonly unboundVariableIndexes:
    Map<string, number>
  nextUnboundVariableIndex: number
}

export interface AZRhsValueCompiler {
  compile(
    value: AZProductionRhsValue,
    bottomDepth: number,
    context: AZRhsCompilationContext,
  ): AZProductionRhsValue
}

export class AZDefaultRhsValueCompiler
  implements AZRhsValueCompiler
{
  public constructor(
    private readonly variableBindingManager:
      AZVariableBindingManager,
  ) {}

  public compile(
    value: AZProductionRhsValue,
    bottomDepth: number,
    context: AZRhsCompilationContext,
  ): AZProductionRhsValue {
    switch (value.type) {
      case 'SYMBOL':
        return this.compileSymbol(
          value,
          bottomDepth,
          context,
        )

      case 'FUNCALL':
        return {
          type: 'FUNCALL',
          functionName: value.functionName,
          arguments: value.arguments.map(
            (argument) =>
              this.compile(
                argument,
                bottomDepth,
                context,
              ),
          ),
        }

      case 'RETE_LOCATION':
      case 'UNBOUND_VARIABLE':
        return value
    }
  }

  private compileSymbol(
    value: Extract<
      AZProductionRhsValue,
      { readonly type: 'SYMBOL' }
    >,
    bottomDepth: number,
    context: AZRhsCompilationContext,
  ): AZProductionRhsValue {
    const symbol = value.symbol

    if (symbol.type !== 'VARIABLE') {
      return value
    }

    const location =
      this.variableBindingManager
        .findLocation(
          symbol,
          bottomDepth + 1,
        )

    if (location !== null) {
      return {
        type: 'RETE_LOCATION',
        fieldNumber:
          location.fieldNumber,
        levelsUp:
          location.levelsUp - 1,
      }
    }

    const existing =
      context.unboundVariableIndexes
        .get(symbol.id)

    if (existing !== undefined) {
      return {
        type: 'UNBOUND_VARIABLE',
        index: existing,
      }
    }

    const index =
      context.nextUnboundVariableIndex

    context.unboundVariableIndexes.set(
      symbol.id,
      index,
    )

    context.nextUnboundVariableIndex += 1

    return {
      type: 'UNBOUND_VARIABLE',
      index,
    }
  }
}
