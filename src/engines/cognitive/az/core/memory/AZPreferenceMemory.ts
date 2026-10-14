import type { AZLinkAdditionProcessor } from '../decision/AZLinkAdditionProcessor'
import type { AZLinkRemovalProcessor } from '../decision/AZLinkRemovalProcessor'
import type { AZPreference } from '../operator/AZPreference'
import type { AZPreferenceSlot } from '../operator/AZPreferenceSlot'
import { isAZBinaryPreferenceType } from '../operator/AZPreferenceTypeSemantics'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZContextChangeTracker } from '../state/AZContextChangeTracker'

export class AZPreferenceMemory {
  private readonly slots =
    new Map<
      AZSymbol,
      Map<AZSymbol, AZPreferenceSlot>
    >()

  private readonly changedSlots:
    AZPreferenceSlot[] = []

  private readonly changedAcceptablePreferenceSlots:
    AZPreferenceSlot[] = []

  private readonly slotsForPossibleRemoval:
    AZPreferenceSlot[] = []

  public constructor(
    private readonly linkAdditionProcessor:
      AZLinkAdditionProcessor | null = null,

    private readonly linkRemovalProcessor:
      AZLinkRemovalProcessor | null = null,

    private readonly contextChangeTracker:
      AZContextChangeTracker | null = null,
  ) {}

  public add(
    preference: AZPreference,
  ): boolean {
    const instantiation =
      preference.instantiation

    if (instantiation === null) {
      throw new Error(
        'Preference entering temporary memory requires an instantiation',
      )
    }

    const slot =
      this.getOrCreateSlot(
        preference.identifier,
        preference.attribute,
      )

    slot.allPreferences.unshift(
      preference,
    )

    const byType =
      slot.preferencesByType.get(
        preference.type,
      ) ?? []

    const insertionIndex =
      byType.findIndex(
        (existing) => {
          const existingInstantiation =
            existing.instantiation

          if (
            existingInstantiation === null
          ) {
            return true
          }

          return (
            existingInstantiation
              .matchGoalLevel <=
            instantiation.matchGoalLevel
          )
        },
      )

    if (insertionIndex < 0) {
      byType.push(preference)
    } else {
      byType.splice(
        insertionIndex,
        0,
        preference,
      )
    }

    slot.preferencesByType.set(
      preference.type,
      byType,
    )

    preference.slot = slot
    preference.inTemporaryMemory = true

    this.markSlotAsChanged(slot)

    if (
      preference.identifier.type ===
        'IDENTIFIER'
    ) {
      if (
        preference.value.type ===
          'IDENTIFIER'
      ) {
        this.linkAdditionProcessor?.post(
          preference.identifier,
          preference.value,
        )
      }

      if (
        isAZBinaryPreferenceType(
          preference.type,
        ) &&
        preference.referent !== null &&
        preference.referent.type ===
          'IDENTIFIER'
      ) {
        this.linkAdditionProcessor?.post(
          preference.identifier,
          preference.referent,
        )
      }
    }

    if (
      slot.isaContextSlot &&
      (
        preference.type ===
          'ACCEPTABLE' ||
        preference.type ===
          'REQUIRE'
      )
    ) {
      this.markAcceptablePreferenceChanged(
        slot,
      )
    }

    return true
  }

  public processOSupportedReject(
    reject: AZPreference,
  ): readonly AZPreference[] {
    if (
      reject.type !== 'REJECT' ||
      !reject.oSupported
    ) {
      throw new Error(
        'Expected o-supported REJECT preference',
      )
    }

    const slot =
      this.getSlot(
        reject.identifier,
        reject.attribute,
      )

    if (slot === null) {
      return []
    }

    const matching =
      slot.allPreferences.filter(
        preference =>
          preference.value ===
          reject.value,
      )

    for (const preference of matching) {
      this.remove(preference)
    }

    return matching
  }
  public remove(
    preference: AZPreference,
  ): boolean {
    const slot =
      preference.slot

    if (
      slot === null ||
      !preference.inTemporaryMemory
    ) {
      return false
    }

    const allIndex =
      slot.allPreferences.indexOf(
        preference,
      )

    if (allIndex >= 0) {
      slot.allPreferences.splice(
        allIndex,
        1,
      )
    }

    const byType =
      slot.preferencesByType.get(
        preference.type,
      )

    if (byType !== undefined) {
      const typeIndex =
        byType.indexOf(preference)

      if (typeIndex >= 0) {
        byType.splice(
          typeIndex,
          1,
        )
      }

      if (byType.length === 0) {
        slot.preferencesByType.delete(
          preference.type,
        )
      }
    }

    preference.inTemporaryMemory = false
    preference.slot = null

    this.markSlotAsChanged(slot)

    if (
      slot.isaContextSlot &&
      (
        preference.type ===
          'ACCEPTABLE' ||
        preference.type ===
          'REQUIRE'
      )
    ) {
      this.markAcceptablePreferenceChanged(
        slot,
      )
    }

    if (
      preference.identifier.type ===
        'IDENTIFIER'
    ) {
      if (
        preference.value.type ===
          'IDENTIFIER'
      ) {
        this.linkRemovalProcessor?.post(
          preference.identifier,
          preference.value,
        )
      }

      if (
        isAZBinaryPreferenceType(
          preference.type,
        ) &&
        preference.referent !== null &&
        preference.referent.type ===
          'IDENTIFIER'
      ) {
        this.linkRemovalProcessor?.post(
          preference.identifier,
          preference.referent,
        )
      }
    }

    return true
  }

  public removePreferencesFromGoal(
    goal: AZSymbol,
  ): number {
    const preferences: AZPreference[] = []

    for (const byAttribute of this.slots.values()) {
      for (const slot of byAttribute.values()) {
        for (const preference of slot.allPreferences) {
          if (
            preference.instantiation?.matchGoal ===
            goal
          ) {
            preferences.push(preference)
          }
        }
      }
    }

    let removed = 0

    for (const preference of preferences) {
      if (preference.inTemporaryMemory) {
        this.remove(preference)
      }

      removed += 1
    }

    return removed
  }
  public getSlot(
    identifier: AZSymbol,
    attribute: AZSymbol,
  ): AZPreferenceSlot | null {
    return (
      this.slots
        .get(identifier)
        ?.get(attribute) ??
      null
    )
  }

  public getSlotsForIdentifier(
    identifier: AZSymbol,
  ): readonly AZPreferenceSlot[] {
    const byAttribute =
      this.slots.get(identifier)

    if (byAttribute === undefined) {
      return []
    }

    return Array.from(
      byAttribute.values(),
    )
  }

  public getSlots():
    readonly AZPreferenceSlot[] {
    return Array.from(
      this.slots.values(),
    ).flatMap(
      byAttribute =>
        Array.from(
          byAttribute.values(),
        ),
    )
  }
  public getChangedSlots():
    readonly AZPreferenceSlot[] {
    return [...this.changedSlots]
  }

  public getAcceptablePreferenceChangedSlots():
    readonly AZPreferenceSlot[] {
    return [
      ...this.changedAcceptablePreferenceSlots,
    ]
  }

  public getSlotsForPossibleRemoval():
    readonly AZPreferenceSlot[] {
    return [
      ...this.slotsForPossibleRemoval,
    ]
  }
  public takeNextChangedSlot():
    AZPreferenceSlot | null {
    const slot =
      this.changedSlots.shift()

    return slot ?? null
  }

  public markSlotAsChanged(
    slot: AZPreferenceSlot,
  ): void {
    if (slot.isaContextSlot) {
      slot.changed = true

      if (this.contextChangeTracker !== null) {
        this.contextChangeTracker
          .markGoalAsContextChanged(
            slot.identifier,
          )
      }

      return
    }

    if (slot.changed) {
      return
    }

    slot.changed = true
    this.changedSlots.unshift(slot)
  }

  public takeNextAcceptablePreferenceChangedSlot():
    AZPreferenceSlot | null {
    const slot =
      this.changedAcceptablePreferenceSlots
        .shift()

    return slot ?? null
  }

  public markAcceptablePreferenceChanged(
    slot: AZPreferenceSlot,
  ): void {
    if (
      slot.acceptablePreferenceChanged
    ) {
      return
    }

    slot.acceptablePreferenceChanged =
      true

    this.changedAcceptablePreferenceSlots
      .unshift(slot)
  }

  public markSlotForPossibleRemoval(
    slot: AZPreferenceSlot,
  ): void {
    if (
      slot.markedForPossibleRemoval
    ) {
      return
    }

    slot.markedForPossibleRemoval = true

    this.slotsForPossibleRemoval.push(
      slot,
    )
  }

  public removeGarbageSlots(): number {
    let removed = 0

    while (
      this.slotsForPossibleRemoval
        .length > 0
    ) {
      const slot =
        this.slotsForPossibleRemoval
          .shift()

      if (slot === undefined) {
        break
      }

      if (
        slot.wmes.length > 0 ||
        slot.allPreferences.length > 0
      ) {
        slot.markedForPossibleRemoval =
          false
        continue
      }

      const changedIndex =
        this.changedSlots.indexOf(slot)

      if (changedIndex >= 0) {
        this.changedSlots.splice(
          changedIndex,
          1,
        )
      }

      slot.changed = false

      const acceptableChangedIndex =
        this.changedAcceptablePreferenceSlots
          .indexOf(slot)

      if (
        acceptableChangedIndex >= 0
      ) {
        this.changedAcceptablePreferenceSlots
          .splice(
            acceptableChangedIndex,
            1,
          )
      }

      slot.acceptablePreferenceChanged =
        false

      const byAttribute =
        this.slots.get(
          slot.identifier,
        )

      if (byAttribute !== undefined) {
        byAttribute.delete(
          slot.attribute,
        )

        if (byAttribute.size === 0) {
          this.slots.delete(
            slot.identifier,
          )
        }
      }

      slot.markedForPossibleRemoval =
        false

      removed += 1
    }

    return removed
  }

  public getOrCreateContextSlot(
    identifier: AZSymbol,
    attribute: AZSymbol,
  ): AZPreferenceSlot {
    const slot =
      this.getOrCreateSlot(
        identifier,
        attribute,
      )

    slot.isaContextSlot = true

    return slot
  }
  private getOrCreateSlot(
    identifier: AZSymbol,
    attribute: AZSymbol,
  ): AZPreferenceSlot {
    let byAttribute =
      this.slots.get(identifier)

    if (byAttribute === undefined) {
      byAttribute =
        new Map<
          AZSymbol,
          AZPreferenceSlot
        >()

      this.slots.set(
        identifier,
        byAttribute,
      )
    }

    const existing =
      byAttribute.get(attribute)

    if (existing !== undefined) {
      return existing
    }

    const slot: AZPreferenceSlot = {
      identifier,
      attribute,
      allPreferences: [],
      preferencesByType: new Map(),
      wmes: [],
      isaContextSlot: false,
      impasseType: 'NONE',
      impasseId: null,
      acceptablePreferenceChanged:
        false,
      acceptablePreferenceWmes: [],
      changed: false,
      markedForPossibleRemoval: false,
    }

    byAttribute.set(
      attribute,
      slot,
    )

    return slot
  }
}


