import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreference } from '../operator/AZPreference'
import type { AZProduction } from './AZProduction'
import type { AZProductionAction } from './AZProductionAction'
import type { AZProductionCondition } from './AZProductionCondition'

export class AZJustificationMaterializer {
  public materialize(
    name: string,
    grounds: readonly AZWorkingMemoryElement[],
    results: readonly AZPreference[],
  ): AZProduction {
    const conditions:
      AZProductionCondition[] =
      grounds.map(wme => ({
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
      }))

    const actions:
      AZProductionAction[] =
      results.map(preference => {
        const action:
          Extract<
            AZProductionAction,
            { readonly type: 'MAKE' }
          > = {
          type: 'MAKE',
          preferenceType:
            preference.type,
          identifier: {
            type: 'SYMBOL',
            symbol:
              preference.identifier,
          },
          attribute: {
            type: 'SYMBOL',
            symbol:
              preference.attribute,
          },
          value: {
            type: 'SYMBOL',
            symbol:
              preference.value,
          },
          support: 'O_SUPPORT',
        }

        if (preference.referent !== null) {
          return {
            ...action,
            referent: {
              type: 'SYMBOL',
              symbol:
                preference.referent,
            },
          }
        }

        return action
      })

    return {
      name,
      declaredSupport: 'O_SUPPORT',
      conditions,
      actions,
      instantiations: [],
      productionNode: null,
    }
  }
}
