import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalStateResolver } from './AZGoalStateResolver'
import type {
  AZReteMatchGoal,
  AZReteMatchGoalResolver,
} from './AZReteMatchGoalResolver'
import type { AZToken } from './AZToken'

export class AZDefaultReteMatchGoalResolver
  implements AZReteMatchGoalResolver
{
  public constructor(
    private readonly goalStateResolver: AZGoalStateResolver,
  ) {}

  public resolve(
    token: AZToken,
    workingMemoryElement: AZWorkingMemoryElement | null,
  ): AZReteMatchGoal {
    let lowestGoal: AZSymbol | null = null
    let lowestGoalLevel = Number.NEGATIVE_INFINITY

    const inspect = (
      wme: AZWorkingMemoryElement | null,
    ): void => {
      if (
        wme === null ||
        wme.identifier.type !== 'IDENTIFIER' ||
        !this.goalStateResolver.isGoal(wme.identifier)
      ) {
        return
      }

      const level =
        this.goalStateResolver.getLevel(wme.identifier)

      if (
        lowestGoal === null ||
        level > lowestGoalLevel
      ) {
        lowestGoal = wme.identifier
        lowestGoalLevel = level
      }
    }

    inspect(workingMemoryElement)

    let currentToken: AZToken | null = token

    while (currentToken !== null) {
      inspect(currentToken.workingMemoryElement)
      currentToken = currentToken.parent
    }

    if (lowestGoal !== null) {
      return {
        goal: lowestGoal,
        level: lowestGoalLevel,
      }
    }

    const describeWme = (
      wme: AZWorkingMemoryElement | null,
    ) => {
      if (wme === null) {
        return null
      }

      const identifier = wme.identifier
      const isGoal =
        identifier.type === 'IDENTIFIER' &&
        this.goalStateResolver.isGoal(identifier)

      return {
        timetag: wme.timetag,
        identifier:
          identifier,
        attribute: wme.attribute,
        value: wme.value,
        acceptable: wme.acceptable,
        isGoal,
        goalLevel:
          isGoal
            ? this.goalStateResolver.getLevel(identifier)
            : null,
      }
    }

    const tokenWmes = []
    let diagnosticToken: AZToken | null = token

    while (diagnosticToken !== null) {
      tokenWmes.push(
        describeWme(
          diagnosticToken.workingMemoryElement,
        ),
      )
      diagnosticToken = diagnosticToken.parent
    }

    console.error(
      'AZ-RETE-MATCH-GOAL-FAIL:',
      JSON.stringify({
        workingMemoryElement:
          describeWme(workingMemoryElement),
        tokenWmes,
      }),
    )

    throw new Error(
      'Cannot find goal for RETE match assertion',
    )
  }
}
