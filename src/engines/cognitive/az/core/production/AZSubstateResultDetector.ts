import type { AZPreference } from '../operator/AZPreference'
import type { AZGoalIdentityRegistry } from '../state/AZGoalIdentityRegistry'
import type { AZInstantiation } from './AZInstantiation'

export class AZSubstateResultDetector {
  public constructor(
    private readonly goalIdentityRegistry:
      AZGoalIdentityRegistry,
  ) {}

  public detect(
    instantiation: AZInstantiation,
  ): readonly AZPreference[] {
    if (instantiation.matchGoal === null) {
      return []
    }

    return instantiation.generatedPreferences.filter(
      preference =>
        this.goalIdentityRegistry.isGoal(
          preference.identifier,
        ) &&
        this.goalIdentityRegistry.getLevel(
          preference.identifier,
        ) < instantiation.matchGoalLevel,
    )
  }
}
