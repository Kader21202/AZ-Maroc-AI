import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreference } from '../operator/AZPreference'
import type { AZGoalStructuralStateRegistry } from '../state/AZGoalStructuralStateRegistry'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'
import type { AZImpasseItemInstantiationCreator } from '../production/AZImpasseItemInstantiationCreator'
import { AZImpasseItemBacktraceRegistry } from './AZImpasseItemBacktraceRegistry'

export class AZImpasseItemsUpdater {
  public constructor(
    private readonly predefinedSymbols:
      AZPredefinedSymbols,

    private readonly symbolManager:
      AZSymbolManager,

    private readonly instantiationCreator:
      AZImpasseItemInstantiationCreator,

    private readonly backtraceRegistry:
      AZImpasseItemBacktraceRegistry,

    private readonly structuralRegistry:
      AZGoalStructuralStateRegistry,
  ) {}

  public update(
    identifier: AZSymbol,
    candidates:
      readonly AZPreference[],
    workingMemory:
      AZWorkingMemory,
  ): void {
    this.updatePass(
      identifier,
      candidates,
      this.predefinedSymbols.item,
      this.predefinedSymbols.itemCount,
      false,
      workingMemory,
    )

    this.updatePass(
      identifier,
      candidates,
      this.predefinedSymbols.nonNumeric,
      this.predefinedSymbols.nonNumericCount,
      true,
      workingMemory,
    )
  }

  private updatePass(
    identifier: AZSymbol,
    candidates:
      readonly AZPreference[],
    itemAttribute: AZSymbol,
    countAttribute: AZSymbol,
    excludeNumericIndifferent: boolean,
    workingMemory:
      AZWorkingMemory,
  ): void {
    const structuralState =
      this.structuralRegistry.get(
        identifier,
      )

    const blockedValues =
      new Set<AZSymbol>()

    if (
      excludeNumericIndifferent &&
      candidates.length > 0
    ) {
      const first =
        candidates[0]

      if (first === undefined) {
        throw new Error(
          'Missing impasse candidate',
        )
      }

      const slot =
        first.slot

      if (slot === null) {
        throw new Error(
          'Impasse candidate requires a preference slot',
        )
      }

      const numericPreferences =
        slot.preferencesByType.get(
          'NUMERIC_INDIFFERENT',
        ) ?? []

      for (
        const preference of
        numericPreferences
      ) {
        blockedValues.add(
          preference.value,
        )
      }
    }

    const desired =
      candidates.filter(
        (candidate) =>
          !blockedValues.has(
            candidate.value,
          ),
      )

    const desiredValues =
      new Set(
        desired.map(
          (candidate) =>
            candidate.value,
        ),
      )

    const existingItems =
      new Map<
        AZSymbol,
        AZWorkingMemoryElement
      >()

    for (
      let index =
        structuralState.impasseWmes.length -
        1;
      index >= 0;
      index -= 1
    ) {
      const wme =
        structuralState.impasseWmes[
          index
        ]

      if (wme === undefined) {
        continue
      }

      if (
        wme.attribute ===
        itemAttribute
      ) {
        if (
          desiredValues.has(
            wme.value,
          ) &&
          !existingItems.has(
            wme.value,
          )
        ) {
          existingItems.set(
            wme.value,
            wme,
          )
        } else {
          structuralState.impasseWmes.splice(
            index,
            1,
          )

          this.backtraceRegistry.remove(
            wme,
          )

          workingMemory.scheduleRemove(
            wme,
          )
        }

        continue
      }

      if (
        wme.attribute ===
        countAttribute
      ) {
        structuralState.impasseWmes.splice(
          index,
          1,
        )

        this.backtraceRegistry.remove(
          wme,
        )

        workingMemory.scheduleRemove(
          wme,
        )
      }
    }

    for (const candidate of desired) {
      const backtracePreference =
        this.instantiationCreator.create(
          identifier,
          candidate,
        )

      const existing =
        existingItems.get(
          candidate.value,
        )

      if (existing !== undefined) {
        this.backtraceRegistry.set(
          existing,
          backtracePreference,
        )

        continue
      }

      const wme =
        workingMemory.createElement(
          identifier,
          itemAttribute,
          candidate.value,
          false,
        )

      structuralState.impasseWmes.unshift(
        wme,
      )

      this.backtraceRegistry.set(
        wme,
        backtracePreference,
      )

      workingMemory.scheduleAdd(
        wme,
      )
    }

    if (desired.length > 0) {
      const countSymbol =
        this.symbolManager
          .makeIntegerConstant(
            desired.length,
          )

      const countWme =
        workingMemory.createElement(
          identifier,
          countAttribute,
          countSymbol,
          false,
        )

      structuralState.impasseWmes.unshift(
        countWme,
      )

      workingMemory.scheduleAdd(
        countWme,
      )
    }
  }
}
