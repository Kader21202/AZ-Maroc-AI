import type { AZProduction } from '../production/AZProduction'
import type { AZProductionTest } from '../production/AZProductionTest'
import type { AZProductionRhsValue } from '../production/AZProductionRhsValue'
import type { AZSymbol } from '../symbols/AZSymbol'
import { AZSymbolManager } from '../symbols/AZSymbolManager'

export class AZCausalRuleGeneralizer {
  public constructor(
    private readonly symbols: AZSymbolManager,
  ) {}

  public generalize(
    name: string,
    source: AZProduction,
  ): AZProduction {
    const variables = new Map<AZSymbol, AZSymbol>()
    let nextVariable = 1

    const replaceSymbol = (symbol: AZSymbol): AZSymbol => {
      if (symbol.type !== 'IDENTIFIER') {
        return symbol
      }

      const existing = variables.get(symbol)
      if (existing) return existing

      const variable = this.symbols.makeVariable(
        `<az-learn-${nextVariable++}>`,
      )

      variables.set(symbol, variable)
      return variable
    }

    const replaceTest = (test: AZProductionTest): AZProductionTest => ({
      ...test,
      ...(test.referent
        ? { referent: replaceSymbol(test.referent) }
        : {}),
      ...(test.disjunction
        ? { disjunction: test.disjunction.map(replaceSymbol) }
        : {}),
      ...(test.conjuncts
        ? { conjuncts: test.conjuncts.map(replaceTest) }
        : {}),
    })

    const replaceValue = (
      value: AZProductionRhsValue,
    ): AZProductionRhsValue => {
      switch (value.type) {
        case 'SYMBOL':
          return {
            type: 'SYMBOL',
            symbol: replaceSymbol(value.symbol),
          }

        case 'FUNCALL':
          return {
            ...value,
            arguments: value.arguments.map(replaceValue),
          }

        default:
          return value
      }
    }

    return {
      name,
      declaredSupport: source.declaredSupport,
      conditions: source.conditions.map(condition => {
        if (condition.type === 'CONJUNCTIVE_NEGATION') {
          return condition
        }

        return {
          ...condition,
          identifierTest: replaceTest(condition.identifierTest),
          attributeTest: replaceTest(condition.attributeTest),
          valueTest: replaceTest(condition.valueTest),
        }
      }),
      actions: source.actions.map(action => {
        if (action.type === 'FUNCALL') {
          return {
            ...action,
            functionCall: replaceValue(action.functionCall),
          }
        }

        return {
          ...action,
          identifier: replaceValue(action.identifier),
          attribute: replaceValue(action.attribute),
          value: replaceValue(action.value),
          ...(action.referent
            ? { referent: replaceValue(action.referent) }
            : {}),
        }
      }),
      instantiations: [],
      productionNode: null,
    }
  }
}
