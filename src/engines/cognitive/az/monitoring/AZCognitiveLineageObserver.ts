import type { AZWmeCausalProvenanceRegistry } from '../core/AZWmeCausalProvenanceRegistry'
import type { AZInstantiation } from '../core/production/AZInstantiation'
import type { AZWorkingMemoryElement } from '../core/memory/AZWorkingMemoryElement'
import type { CognitiveLineageObservationHandler } from './CognitiveLineageObservationHandler'

export class AZCognitiveLineageObserver {
  public constructor(
    private readonly causalProvenanceRegistry:
      AZWmeCausalProvenanceRegistry,
    private readonly observationHandler:
      CognitiveLineageObservationHandler,
  ) {}

  public observe(
    instantiations: readonly AZInstantiation[],
  ): void {
    for (const instantiation of instantiations) {
      if (instantiation.production === null) {
        continue
      }

      const premises =
        instantiation.instantiatedConditions
          .filter(
            condition =>
              condition.type === 'POSITIVE' &&
              condition.workingMemoryElement !== null,
          )
          .map(condition => {
            if (
              condition.type !== 'POSITIVE' ||
              condition.workingMemoryElement === null
            ) {
              throw new Error(
                'AZ cognitive lineage expected positive WME premise.',
              )
            }

            const wme =
              condition.workingMemoryElement

            const producerInstantiation =
              this.causalProvenanceRegistry.resolve(
                wme,
              )

            const producerProductionName =
              producerInstantiation?.production?.name

            const producerProductionChain =
              this.buildProducerProductionChain(
                wme,
              )

            return {
              timetag: wme.timetag,
              attribute:
                String(wme.attribute.value),
              value:
                String(wme.value.value),
              producerProductionName,
              producerProductionChain,
              causalDepth:
                producerProductionChain.length,
            }
          })

      this.observationHandler.handle({
        productionName:
          instantiation.production.name,
        premises,
      })
    }
  }

  private buildProducerProductionChain(
    wme: AZWorkingMemoryElement,
    visitedInstantiationIds =
      new Set<number>(),
  ): string[] {
    const producerInstantiation =
      this.causalProvenanceRegistry.resolve(
        wme,
      )

    if (
      producerInstantiation === null ||
      producerInstantiation.production === null ||
      visitedInstantiationIds.has(
        producerInstantiation.id,
      )
    ) {
      return []
    }

    const nextVisited =
      new Set(
        visitedInstantiationIds,
      )

    nextVisited.add(
      producerInstantiation.id,
    )

    const chain = [
      producerInstantiation.production.name,
    ]

    for (
      const producerCondition of
        producerInstantiation.instantiatedConditions
    ) {
      if (
        producerCondition.type !== 'POSITIVE' ||
        producerCondition.workingMemoryElement === null
      ) {
        continue
      }

      chain.push(
        ...this.buildProducerProductionChain(
          producerCondition.workingMemoryElement,
          nextVisited,
        ),
      )
    }

    return chain
  }
}
