import type { AZPreferenceMemory } from '../core/memory/AZPreferenceMemory'
import type { AZWorkingMemory } from '../core/memory/AZWorkingMemory'
import type { AZPreference } from '../core/operator/AZPreference'
import type { AZPreferenceSlot } from '../core/operator/AZPreferenceSlot'
import type { AZMatchSet } from '../core/production/AZMatchSet'
import { AZMatchSetStructuralStateExtractor } from './AZMatchSetStructuralStateExtractor'
import { AZWorkingMemoryStructuralStateExtractor } from './AZWorkingMemoryStructuralStateExtractor'
import type {
  QPreferenceSlotReferenceObservation,
  QStructuralStateObservation,
} from './QStructuralStateObservation'

export class AZQStructuralStateExtractor {
  private readonly matchSetExtractor:
    AZMatchSetStructuralStateExtractor

  public constructor(
    private readonly workingMemoryExtractor =
      new AZWorkingMemoryStructuralStateExtractor(),
  ) {
    this.matchSetExtractor =
      new AZMatchSetStructuralStateExtractor(
        this.workingMemoryExtractor,
      )
  }

  public extract(
    workingMemory: AZWorkingMemory,
    preferenceMemory: AZPreferenceMemory,
    matchSet: AZMatchSet,
  ): QStructuralStateObservation {
    return {
      workingMemory:
        this.workingMemoryExtractor
          .extract(workingMemory)
          .elements,
      preferenceSlots:
        preferenceMemory
          .getSlots()
          .map(slot => ({
            identifier:
              this.workingMemoryExtractor
                .observeSymbol(
                  slot.identifier,
                ),
            attribute:
              this.workingMemoryExtractor
                .observeSymbol(
                  slot.attribute,
                ),
            isaContextSlot:
              slot.isaContextSlot,
            impasseType:
              slot.impasseType,
            impasseId:
              slot.impasseId === null
                ? null
                : this.workingMemoryExtractor
                    .observeSymbol(
                      slot.impasseId,
                    ),
            acceptablePreferenceChanged:
              slot.acceptablePreferenceChanged,
            changed:
              slot.changed,
            markedForPossibleRemoval:
              slot.markedForPossibleRemoval,
            preferences:
              slot.allPreferences.map(
                preference =>
                  this.observePreference(preference),
              ),
            preferencesByType:
              Array.from(
                slot.preferencesByType.entries(),
              ).map(([type, preferences]) => ({
                type,
                preferences: preferences.map(
                  preference =>
                    this.observePreference(preference),
                ),
              })),
            wmes:
              slot.wmes.map(element =>
                this.workingMemoryExtractor
                  .observeElement(element),
              ),
            acceptablePreferenceWmes:
              slot.acceptablePreferenceWmes
                .map(element =>
                  this.workingMemoryExtractor
                    .observeElement(element),
                ),
          })),
      changedSlots:
        preferenceMemory
          .getChangedSlots()
          .map(slot =>
            this.observeSlotReference(slot),
          ),
      acceptablePreferenceChangedSlots:
        preferenceMemory
          .getAcceptablePreferenceChangedSlots()
          .map(slot =>
            this.observeSlotReference(slot),
          ),
      slotsForPossibleRemoval:
        preferenceMemory
          .getSlotsForPossibleRemoval()
          .map(slot =>
            this.observeSlotReference(slot),
          ),
      matchSet:
        this.matchSetExtractor.extract(
          matchSet,
        ),
    }
  }

  private observePreference(
    preference: AZPreference,
  ) {
    return {
      type: preference.type,
      identifier: this.workingMemoryExtractor.observeSymbol(preference.identifier),
      attribute: this.workingMemoryExtractor.observeSymbol(preference.attribute),
      value: this.workingMemoryExtractor.observeSymbol(preference.value),
      referent: preference.referent === null
        ? null
        : this.workingMemoryExtractor.observeSymbol(preference.referent),
      level: preference.level,
      numericValue: preference.numericValue,
      oSupported: preference.oSupported,
      inTemporaryMemory: preference.inTemporaryMemory,
      instantiationMatchGoalLevel:
        preference.instantiation?.matchGoalLevel ?? null,
    }
  }

  private observeSlotReference(
    slot: AZPreferenceSlot,
  ): QPreferenceSlotReferenceObservation {
    return {
      identifier:
        this.workingMemoryExtractor
          .observeSymbol(
            slot.identifier,
          ),
      attribute:
        this.workingMemoryExtractor
          .observeSymbol(
            slot.attribute,
          ),
    }
  }
}
