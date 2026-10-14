import { AZWmeCausalProvenanceRegistry } from '../AZWmeCausalProvenanceRegistry'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type { AZInstantiation } from './AZInstantiation'

type AZGroundExtractionTask =
  | {
      readonly type: 'INSTANTIATION'
      readonly instantiation: AZInstantiation
    }
  | {
      readonly type: 'WME'
      readonly wme: AZWorkingMemoryElement
    }

export class AZSubstateGroundExtractor {
  public constructor(
    private readonly provenance:
      AZWmeCausalProvenanceRegistry,

    private readonly identifierStates:
      AZIdentifierLinkStateRegistry,

    private readonly structuralStates?:
      AZGoalStructuralStateRegistry,
  ) {}

  public extract(
    instantiation: AZInstantiation,
  ): readonly AZWorkingMemoryElement[] {
    const grounds:
      AZWorkingMemoryElement[] = []

    const groundSet =
      new Set<AZWorkingMemoryElement>()

    const visitedInstantiations =
      new Set<AZInstantiation>()

    const visitedWmes =
      new Set<AZWorkingMemoryElement>()

    const tasks: AZGroundExtractionTask[] = [
      {
        type: 'INSTANTIATION',
        instantiation,
      },
    ]

    while (tasks.length > 0) {
      const task = tasks.pop()!

      if (task.type === 'WME') {
        const wme = task.wme

        if (visitedWmes.has(wme)) {
          continue
        }

        visitedWmes.add(wme)

        if (
          wme.identifier.type === 'IDENTIFIER' &&
          this.identifierStates.has(wme.identifier) &&
          this.identifierStates.get(wme.identifier).level <
            instantiation.matchGoalLevel
        ) {
          if (!groundSet.has(wme)) {
            groundSet.add(wme)
            grounds.push(wme)
          }

          continue
        }

        const producer =
          this.provenance.resolve(wme)

        if (producer !== null) {
          tasks.push({
            type: 'INSTANTIATION',
            instantiation: producer,
          })

          continue
        }

        if (
          this.structuralStates !== undefined &&
          wme.identifier.type === 'IDENTIFIER' &&
          this.structuralStates.has(wme.identifier)
        ) {
          const structuralState =
            this.structuralStates.get(wme.identifier)


          if (
            structuralState.impasseWmes.includes(wme)
          ) {
            for (
              let index =
                structuralState.impasseWmes.length - 1;
              index >= 0;
              index -= 1
            ) {
              const impasseWme =
                structuralState.impasseWmes[index]

              if (
                impasseWme !== wme &&
                this.provenance.resolve(impasseWme) !== null
              ) {
                tasks.push({
                  type: 'WME',
                  wme: impasseWme,
                })
              }
            }
          }
        }

        continue
      }

      const current = task.instantiation

      if (
        visitedInstantiations.has(current)
      ) {
        continue
      }

      visitedInstantiations.add(current)

      for (
        let index =
          current.instantiatedConditions.length - 1;
        index >= 0;
        index -= 1
      ) {
        const condition =
          current.instantiatedConditions[index]

        if (
          condition.type !== 'POSITIVE' ||
          condition.workingMemoryElement === null
        ) {
          continue
        }

        tasks.push({
          type: 'WME',
          wme: condition.workingMemoryElement,
        })
      }
    }

    return grounds
  }
}

