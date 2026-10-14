import type { AZPreference } from '../core/operator/AZPreference'
import { AZDefaultInstantiatedConditionBuilder } from '../core/production/AZDefaultInstantiatedConditionBuilder'
import { AZDefaultReteParentResolver } from '../core/production/AZDefaultReteParentResolver'
import type { AZInstantiation } from '../core/production/AZInstantiation'
import type { AZInstantiatedCondition } from '../core/production/AZInstantiatedCondition'
import type { AZMatchAssertion, AZMatchSet } from '../core/production/AZMatchSet'
import type { AZProductionTest } from '../core/production/AZProductionTest'
import type {
  QInstantiatedConditionObservation,
  QMatchAssertionObservation,
  QMatchRetractionObservation,
  QMatchSetObservation,
  QPreferenceObservation,
  QProductionTestObservation,
} from './QStructuralStateObservation'
import { AZWorkingMemoryStructuralStateExtractor } from './AZWorkingMemoryStructuralStateExtractor'

export class AZMatchSetStructuralStateExtractor {
  private readonly conditionBuilder =
    new AZDefaultInstantiatedConditionBuilder(
      new AZDefaultReteParentResolver(),
    )

  public constructor(
    private readonly workingMemoryExtractor =
      new AZWorkingMemoryStructuralStateExtractor(),
  ) {}

  public extract(
    matchSet: AZMatchSet,
  ): QMatchSetObservation {
    return {
      assertions:
        matchSet.getAssertions().map(
          assertion =>
            this.observeAssertion(assertion),
        ),
      retractions:
        matchSet.getRetractions().map(
          retraction =>
            this.observeRetraction(
              retraction.instantiation,
            ),
        ),
      nilGoalRetractions:
        matchSet.getNilGoalRetractions().map(
          retraction =>
            this.observeRetraction(
              retraction.instantiation,
            ),
        ),
    }
  }

  private observeAssertion(
    assertion: AZMatchAssertion,
  ): QMatchAssertionObservation {
    const productionNode =
      assertion.token.node

    if (
      productionNode === null ||
      productionNode.type !== 'PRODUCTION'
    ) {
      throw new Error(
        'Match assertion requires a PRODUCTION token node',
      )
    }

    const conditions =
      this.conditionBuilder.build(
        assertion.production,
        productionNode,
        assertion.token.parent,
        assertion.wme,
      )

    return {
      type: assertion.type,
      productionName:
        assertion.production.name,
      matchGoal:
        assertion.matchGoal === null
          ? null
          : this.workingMemoryExtractor
              .observeSymbol(
                assertion.matchGoal,
              ),
      matchGoalLevel:
        assertion.matchGoalLevel,
      conditions:
        conditions.map(condition =>
          this.observeCondition(condition),
        ),
      terminalWme:
        assertion.wme === null
          ? null
          : this.workingMemoryExtractor
              .observeElement(assertion.wme),
    }
  }

  private observeRetraction(
    instantiation: AZInstantiation,
  ): QMatchRetractionObservation {
    return {
      productionName:
        instantiation.production?.name ??
        null,
      matchGoal:
        instantiation.matchGoal === null
          ? null
          : this.workingMemoryExtractor
              .observeSymbol(
                instantiation.matchGoal,
              ),
      matchGoalLevel:
        instantiation.matchGoalLevel,
      conditions:
        instantiation.instantiatedConditions
          .map(condition =>
            this.observeCondition(condition),
          ),
      generatedPreferences:
        instantiation.generatedPreferences
          .map(preference =>
            this.observePreference(preference),
          ),
      inMatchSet:
        instantiation.inMatchSet,
    }
  }

  private observeCondition(
    condition: AZInstantiatedCondition,
  ): QInstantiatedConditionObservation {
    switch (condition.type) {
      case 'POSITIVE':
        return {
          type: 'POSITIVE',
          identifierTest:
            this.observeTest(
              condition.sourceCondition
                .identifierTest,
            ),
          attributeTest:
            this.observeTest(
              condition.sourceCondition
                .attributeTest,
            ),
          valueTest:
            this.observeTest(
              condition.sourceCondition
                .valueTest,
            ),
          acceptable:
            condition.sourceCondition
              .acceptable,
          workingMemoryElement:
            condition.workingMemoryElement ===
            null
              ? null
              : this.workingMemoryExtractor
                  .observeElement(
                    condition
                      .workingMemoryElement,
                  ),
        }

      case 'NEGATIVE':
        return {
          type: 'NEGATIVE',
          identifierTest:
            this.observeTest(
              condition.sourceCondition
                .identifierTest,
            ),
          attributeTest:
            this.observeTest(
              condition.sourceCondition
                .attributeTest,
            ),
          valueTest:
            this.observeTest(
              condition.sourceCondition
                .valueTest,
            ),
          acceptable:
            condition.sourceCondition
              .acceptable,
        }

      case 'CONJUNCTIVE_NEGATION':
        return {
          type: 'CONJUNCTIVE_NEGATION',
          conditions:
            condition.conditions.map(
              nested =>
                this.observeCondition(nested),
            ),
        }
    }
  }

  private observeTest(
    test: AZProductionTest,
  ): QProductionTestObservation {
    return {
      type: test.type,
      ...(test.referent === undefined
        ? {}
        : {
            referent:
              this.workingMemoryExtractor
                .observeSymbol(
                  test.referent,
                ),
          }),
      ...(test.disjunction === undefined
        ? {}
        : {
            disjunction:
              test.disjunction.map(symbol =>
                this.workingMemoryExtractor
                  .observeSymbol(symbol),
              ),
          }),
      ...(test.conjuncts === undefined
        ? {}
        : {
            conjuncts:
              test.conjuncts.map(conjunct =>
                this.observeTest(conjunct),
              ),
          }),
    }
  }

  private observePreference(
    preference: AZPreference,
  ): QPreferenceObservation {
    return {
      type: preference.type,
      identifier:
        this.workingMemoryExtractor
          .observeSymbol(
            preference.identifier,
          ),
      attribute:
        this.workingMemoryExtractor
          .observeSymbol(
            preference.attribute,
          ),
      value:
        this.workingMemoryExtractor
          .observeSymbol(
            preference.value,
          ),
      referent:
        preference.referent === null
          ? null
          : this.workingMemoryExtractor
              .observeSymbol(
                preference.referent,
              ),
      level: preference.level,
      numericValue:
        preference.numericValue,
      oSupported: preference.oSupported,
      inTemporaryMemory:
        preference.inTemporaryMemory,
      instantiationMatchGoalLevel:
        preference.instantiation?.matchGoalLevel ?? null,
    }
  }
}
