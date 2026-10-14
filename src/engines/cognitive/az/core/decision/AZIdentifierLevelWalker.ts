import type { AZPreferenceMemory } from '../memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import {
  isAZBinaryPreferenceType,
} from '../operator/AZPreferenceTypeSemantics'
import type { AZSymbol } from '../symbols/AZSymbol'
import type {
  AZIdentifierLinkStateRegistry,
} from '../state/AZIdentifierLinkStateRegistry'
import type {
  AZLinkRemovalProcessor,
} from './AZLinkRemovalProcessor'

export interface AZIdentifierLevelWalker {
  walk(
    root: AZSymbol,
    walkTcNumber: number,
    walkLevel: number,
  ): void
}

export class AZDefaultIdentifierLevelWalker
  implements AZIdentifierLevelWalker
{
  private readonly traversalMarks =
    new Map<AZSymbol, number>()

  public constructor(
    private readonly workingMemory:
      AZWorkingMemory,

    private readonly preferenceMemory:
      AZPreferenceMemory,

    private readonly states:
      AZIdentifierLinkStateRegistry,

    private readonly linkRemovalProcessor:
      AZLinkRemovalProcessor,
  ) {}

  public walk(
    root: AZSymbol,
    walkTcNumber: number,
    walkLevel: number,
  ): void {
    const identifiersToWalk: AZSymbol[] = [
      root,
    ]

    while (identifiersToWalk.length > 0) {
      const identifier =
        identifiersToWalk.pop()

      if (identifier === undefined) {
        continue
      }

      this.traversalMarks.set(
        identifier,
        walkTcNumber,
      )

      const isUnknown =
        this.linkRemovalProcessor
          .getUnknownLevelIdentifiers()
          .includes(identifier)

      const state =
        this.states.get(identifier)

      if (
        !isUnknown &&
        state.level < walkLevel
      ) {
        continue
      }

      if (isUnknown) {
        this.linkRemovalProcessor
          .removeUnknownLevelIdentifier(
            identifier,
          )

        state.level = walkLevel
        state.promotionLevel = walkLevel
      }

      for (
        const wme of
          this.workingMemory.getElements()
      ) {
        if (
          wme.identifier === identifier &&
          this.levelUpdateNeeded(
            wme.value,
            walkTcNumber,
          )
        ) {
          identifiersToWalk.push(
            wme.value,
          )
        }
      }

      for (
        const slot of
          this.preferenceMemory
            .getSlotsForIdentifier(
              identifier,
            )
      ) {
        for (
          const preference of
            slot.allPreferences
        ) {
          if (
            this.levelUpdateNeeded(
              preference.value,
              walkTcNumber,
            )
          ) {
            identifiersToWalk.push(
              preference.value,
            )

            if (
              isAZBinaryPreferenceType(
                preference.type,
              ) &&
              preference.referent !== null &&
              this.levelUpdateNeeded(
                preference.referent,
                walkTcNumber,
              )
            ) {
              identifiersToWalk.push(
                preference.referent,
              )
            }
          }
        }

        if (
          slot.impasseId !== null &&
          this.levelUpdateNeeded(
            slot.impasseId,
            walkTcNumber,
          )
        ) {
          identifiersToWalk.push(
            slot.impasseId,
          )
        }

        for (const wme of slot.wmes) {
          if (
            this.levelUpdateNeeded(
              wme.value,
              walkTcNumber,
            )
          ) {
            identifiersToWalk.push(
              wme.value,
            )
          }
        }
      }
    }
  }

  private levelUpdateNeeded(
    symbol: AZSymbol,
    walkTcNumber: number,
  ): boolean {
    return (
      symbol.type === 'IDENTIFIER' &&
      this.traversalMarks.get(symbol) !==
        walkTcNumber
    )
  }
}
