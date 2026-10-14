import type { AZPreference } from '../operator/AZPreference'
import type { AZGoalStateRegistry } from '../state/AZGoalStateRegistry'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZInstantiatedCondition } from './AZInstantiatedCondition'
import type { AZInstantiation } from './AZInstantiation'
import type { AZProductionCondition } from './AZProductionCondition'

export class AZImpasseItemInstantiationCreator {
  private nextInstantiationId = 1

  public constructor(
    private readonly predefinedSymbols:
      AZPredefinedSymbols,

    private readonly goalStateRegistry:
      AZGoalStateRegistry,

    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,
  ) {}

  public create(
    goal: AZSymbol,
    candidate: AZPreference,
  ): AZPreference {
    const slot = candidate.slot

    if (slot === null) {
      throw new Error(
        'Impasse item candidate requires a preference slot',
      )
    }

    const acceptableWme =
      slot.acceptablePreferenceWmes.find(
        (wme) =>
          wme.value === candidate.value,
      )

    if (acceptableWme === undefined) {
      throw new Error(
        'Impasse item requires an acceptable preference WME',
      )
    }

    const structuralState =
      this.structuralRegistry.get(goal)

    const superstateWme =
      structuralState.impasseWmes.find(
        (wme) =>
          wme.attribute ===
          this.predefinedSymbols.superstate,
      )

    if (superstateWme === undefined) {
      throw new Error(
        'Impasse item requires a superstate WME',
      )
    }

    const instantiatedConditions:
      AZInstantiatedCondition[] = [
        this.createCondition(
          acceptableWme,
        ),
        this.createCondition(
          superstateWme,
        ),
      ]

    const generatedPreferences:
      AZPreference[] = []

    const instantiation:
      AZInstantiation = {
        id: this.nextInstantiationId,
        production: null,
        instantiatedConditions,
        matchGoal: goal,
        matchGoalLevel:
          this.goalStateRegistry.getLevel(
            goal,
          ),
        inMatchSet: false,
        generatedPreferences,
        reteToken: null,
        reteWme: null,
      }

    this.nextInstantiationId += 1

    const preference:
      AZPreference = {
        type: 'ACCEPTABLE',
        identifier: goal,
        attribute:
          this.predefinedSymbols.item,
        value: candidate.value,
        referent: null,
        level: 0,
        numericValue: 0,
        oSupported: false,
        inTemporaryMemory: false,
        slot: null,
        instantiation,
      }

    generatedPreferences.push(
      preference,
    )

    return preference
  }

  private createCondition(
    wme: {
      readonly identifier: AZSymbol
      readonly attribute: AZSymbol
      readonly value: AZSymbol
      readonly acceptable: boolean
    },
  ): AZInstantiatedCondition {
    const sourceCondition:
      Extract<
        AZProductionCondition,
        { readonly type: 'POSITIVE' }
      > = {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: wme.identifier,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent: wme.attribute,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: wme.value,
        },
        acceptable: wme.acceptable,
      }

    return {
      type: 'POSITIVE',
      sourceCondition,
      workingMemoryElement:
        wme as never,
    }
  }
}
