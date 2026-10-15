import type { AZProduction } from '../production/AZProduction'
import type { AZProductionInstaller } from '../production/AZProductionInstaller'
import type { AZSymbol } from '../symbols/AZSymbol'
import { AZCausalRuleGeneralizer } from './AZCausalRuleGeneralizer'

export class AZExperientialLearningHandler {
  public constructor(
    private readonly generalizer: AZCausalRuleGeneralizer,
    private readonly installer: AZProductionInstaller,
  ) {}

  public learn(
    name: string,
    source: AZProduction,
  ): boolean {
    if (
      source.conditions.length === 0 ||
      source.actions.length === 0
    ) {
      return false
    }

    const isEquality = (
      test: { type: string; referent?: AZSymbol },
    ): boolean =>
      test.type === 'EQUALITY' &&
      test.referent !== undefined

    for (const condition of source.conditions) {
      if (condition.type !== 'POSITIVE') {
        return false
      }

      if (
        !isEquality(condition.identifierTest) ||
        !isEquality(condition.attributeTest) ||
        !isEquality(condition.valueTest)
      ) {
        return false
      }
    }

    for (const action of source.actions) {
      if (action.type !== 'MAKE') {
        return false
      }

      if (
        action.identifier.type !== 'SYMBOL' ||
        action.attribute.type !== 'SYMBOL' ||
        action.value.type !== 'SYMBOL' ||
        (action.referent !== undefined &&
          action.referent.type !== 'SYMBOL')
      ) {
        return false
      }
    }

    const candidate =
      this.generalizer.generalize(name, source)

    const boundVariables = new Set<AZSymbol>()

    for (const condition of candidate.conditions) {
      if (condition.type !== 'POSITIVE') {
        return false
      }

      for (const test of [
        condition.identifierTest,
        condition.attributeTest,
        condition.valueTest,
      ]) {
        if (
          test.referent?.type === 'VARIABLE'
        ) {
          boundVariables.add(test.referent)
        }
      }
    }

    for (const action of candidate.actions) {
      if (action.type !== 'MAKE') {
        return false
      }

      const values = [
        action.identifier,
        action.attribute,
        action.value,
        action.referent,
      ]

      for (const value of values) {
        if (
          value?.type === 'SYMBOL' &&
          value.symbol.type === 'VARIABLE' &&
          !boundVariables.has(value.symbol)
        ) {
          return false
        }
      }
    }

    const result = this.installer.install(candidate)

    return result !== 'DUPLICATE_PRODUCTION'
  }
}
