import type { AZProduction } from './AZProduction'
import type { AZProductionAdditionResult } from './AZProductionAdditionResult'
import type { AZProductionMatcher } from './AZProductionMatcher'
import { AZProceduralMemory } from './AZProceduralMemory'

export interface AZProductionInstaller {
  install(
    production: AZProduction,
  ): AZProductionAdditionResult
}

export class AZDefaultProductionInstaller
  implements AZProductionInstaller
{
  public constructor(
    private readonly proceduralMemory:
      AZProceduralMemory,
    private readonly productionMatcher:
      AZProductionMatcher,
  ) {}

  public install(
    production: AZProduction,
  ): AZProductionAdditionResult {
    if (
      this.proceduralMemory.findByName(
        production.name,
      ) !== undefined
    ) {
      throw new Error(
        `Production ${production.name} is already registered in procedural memory`,
      )
    }

    const result =
      this.productionMatcher.addProduction(
        production,
      )

    if (
      result ===
      'DUPLICATE_PRODUCTION'
    ) {
      return result
    }

    const added =
      this.proceduralMemory.add(
        production,
      )

    if (!added) {
      this.productionMatcher
        .exciseProduction(
          production,
        )

      throw new Error(
        `Production ${production.name} could not be registered in procedural memory`,
      )
    }

    return result
  }
}
