import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreference } from '../operator/AZPreference'
import type { AZGoalIdentityRegistry } from '../state/AZGoalIdentityRegistry'
import type { AZInstantiation } from './AZInstantiation'
import type { AZInstantiatedCondition } from './AZInstantiatedCondition'
import type { AZProduction } from './AZProduction'

export class AZJustificationInstantiationCreator {
  private nextInstantiationId = 1

  public constructor(
    private readonly goalIdentityRegistry: AZGoalIdentityRegistry,
  ) {}

  public create(
    production: AZProduction,
    grounds: readonly AZWorkingMemoryElement[],
    results: readonly AZPreference[],
  ): AZInstantiation {
    const matchGoal =
      results.find(result =>
        this.goalIdentityRegistry.isGoal(result.identifier),
      )?.identifier ?? null

    if (matchGoal === null) {
      throw new Error('Justification requires a result goal')
    }

    const instantiatedConditions: AZInstantiatedCondition[] =
      production.conditions.map((condition, index) => {
        if (condition.type !== 'POSITIVE' || grounds[index] === undefined) {
          throw new Error('Justification ground/condition mismatch')
        }

        return {
          type: 'POSITIVE',
          sourceCondition: condition,
          workingMemoryElement: grounds[index],
        }
      })

    const generatedPreferences: AZPreference[] = []

    const instantiation: AZInstantiation = {
      id: this.nextInstantiationId++,
      production,
      instantiatedConditions,
      matchGoal,
      matchGoalLevel: this.goalIdentityRegistry.getLevel(matchGoal),
      inMatchSet: true,
      generatedPreferences,
      reteToken: null,
      reteWme: null,
    }

    for (const result of results) {
      generatedPreferences.push({
        type: result.type,
        identifier: result.identifier,
        attribute: result.attribute,
        value: result.value,
        referent: result.referent,
        level: result.level,
        numericValue: result.numericValue,
        oSupported: true,
        inTemporaryMemory: false,
        slot: null,
        instantiation,
      })
    }

    return instantiation
  }
}
