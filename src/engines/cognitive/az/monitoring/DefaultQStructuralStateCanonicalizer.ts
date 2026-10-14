import type {
  QInstantiatedConditionObservation,
  QPreferenceObservation,
  QPreferenceSlotObservation,
  QProductionTestObservation,
  QStructuralStateObservation,
} from './QStructuralStateObservation'
import type {
  StructuralStateElementObservation,
  StructuralStateSymbolObservation,
} from './StructuralStateObservation'

type StructuralClasses =
  ReadonlyMap<string, string>

export class DefaultQStructuralStateCanonicalizer {
  public canonicalize(
    observation: QStructuralStateObservation,
  ): string {
    const identifiers =
      this.collectIdentifiers(observation)

    if (identifiers.length === 0) {
      return this.serialize(
        observation,
        new Map<string, string>(),
      )
    }

    const initialClasses =
      new Map<string, string>()

    for (const identifier of identifiers) {
      initialClasses.set(
        identifier,
        'C0',
      )
    }

    return this.canonicalizePartition(
      observation,
      identifiers,
      initialClasses,
    )
  }

  private canonicalizePartition(
    observation: QStructuralStateObservation,
    identifiers: readonly string[],
    seedClasses: StructuralClasses,
  ): string {
    const refined =
      this.refineClasses(
        observation,
        identifiers,
        seedClasses,
      )

    const ambiguousClass =
      this.findAmbiguousClass(
        identifiers,
        refined,
      )

    if (ambiguousClass === null) {
      return this.serialize(
        observation,
        refined,
      )
    }

    let best: string | null = null

    for (const candidate of ambiguousClass) {
      const individualized =
        new Map<string, string>()

      for (const identifier of identifiers) {
        const structuralClass =
          refined.get(identifier)

        if (structuralClass === undefined) {
          throw new Error(
            `Missing Q structural class for ${identifier}`,
          )
        }

        individualized.set(
          identifier,
          identifier === candidate
            ? `${structuralClass}|INDIVIDUAL`
            : structuralClass,
        )
      }

      const representation =
        this.canonicalizePartition(
          observation,
          identifiers,
          individualized,
        )

      if (
        best === null ||
        representation.localeCompare(best) < 0
      ) {
        best = representation
      }
    }

    if (best === null) {
      throw new Error(
        'Unable to canonicalize Q structural state',
      )
    }

    return best
  }

  private refineClasses(
    observation: QStructuralStateObservation,
    identifiers: readonly string[],
    seedClasses: StructuralClasses,
  ): Map<string, string> {
    let classes =
      new Map(seedClasses)

    while (true) {
      const signatures =
        new Map<string, string>()

      for (const identifier of identifiers) {
        signatures.set(
          identifier,
          this.buildIdentifierSignature(
            identifier,
            observation,
            classes,
          ),
        )
      }

      const uniqueSignatures =
        Array.from(
          new Set(signatures.values()),
        ).sort()

      const signatureClasses =
        new Map<string, string>()

      uniqueSignatures.forEach(
        (signature, index) => {
          signatureClasses.set(
            signature,
            `C${index + 1}`,
          )
        },
      )

      const nextClasses =
        new Map<string, string>()

      for (const identifier of identifiers) {
        const signature =
          signatures.get(identifier)

        if (signature === undefined) {
          throw new Error(
            `Missing Q signature for ${identifier}`,
          )
        }

        const structuralClass =
          signatureClasses.get(signature)

        if (structuralClass === undefined) {
          throw new Error(
            `Missing Q class for signature ${signature}`,
          )
        }

        nextClasses.set(
          identifier,
          structuralClass,
        )
      }

      if (
        this.samePartition(
          identifiers,
          classes,
          nextClasses,
        )
      ) {
        return nextClasses
      }

      classes = nextClasses
    }
  }

  private samePartition(
    identifiers: readonly string[],
    left: StructuralClasses,
    right: StructuralClasses,
  ): boolean {
    for (
      let firstIndex = 0;
      firstIndex < identifiers.length;
      firstIndex += 1
    ) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < identifiers.length;
        secondIndex += 1
      ) {
        const first =
          identifiers[firstIndex]

        const second =
          identifiers[secondIndex]

        const sameOnLeft =
          left.get(first) ===
          left.get(second)

        const sameOnRight =
          right.get(first) ===
          right.get(second)

        if (sameOnLeft !== sameOnRight) {
          return false
        }
      }
    }

    return true
  }

  private findAmbiguousClass(
    identifiers: readonly string[],
    classes: StructuralClasses,
  ): string[] | null {
    const membersByClass =
      new Map<string, string[]>()

    for (const identifier of identifiers) {
      const structuralClass =
        classes.get(identifier)

      if (structuralClass === undefined) {
        throw new Error(
          `Missing Q structural class for ${identifier}`,
        )
      }

      const members =
        membersByClass.get(structuralClass) ?? []

      members.push(identifier)

      membersByClass.set(
        structuralClass,
        members,
      )
    }

    const ambiguous =
      Array.from(membersByClass.entries())
        .filter(
          ([, members]) =>
            members.length > 1,
        )
        .sort(
          ([leftClass, leftMembers],
           [rightClass, rightMembers]) =>
            leftMembers.length -
              rightMembers.length ||
            leftClass.localeCompare(
              rightClass,
            ),
        )

    if (ambiguous.length === 0) {
      return null
    }

    return ambiguous[0][1]
  }

  private buildIdentifierSignature(
    identifier: string,
    observation: QStructuralStateObservation,
    classes: StructuralClasses,
  ): string {
    const ownClass =
      classes.get(identifier)

    if (ownClass === undefined) {
      throw new Error(
        `Missing Q structural class for ${identifier}`,
      )
    }

    const rootedClasses =
      new Map(classes)

    rootedClasses.set(
      identifier,
      `${ownClass}|ROOT`,
    )

    return JSON.stringify({
      ownClass,
      rootedState:
        this.serialize(
          observation,
          rootedClasses,
        ),
    })
  }

  private serialize(
    observation: QStructuralStateObservation,
    classes: StructuralClasses,
  ): string {
    const workingMemory =
      observation.workingMemory.map(
        element =>
          this.normalizeElement(
            element,
            classes,
          ),
      )

    workingMemory.sort(
      (left, right) =>
        JSON.stringify(left).localeCompare(
          JSON.stringify(right),
        ),
    )

    const preferenceSlots =
      observation.preferenceSlots.map(
        slot =>
          this.normalizeSlot(
            slot,
            classes,
          ),
      )

    preferenceSlots.sort(
      (left, right) =>
        JSON.stringify(left).localeCompare(
          JSON.stringify(right),
        ),
    )

    return JSON.stringify({
      workingMemory,
      preferenceSlots,
      changedSlots:
        observation.changedSlots.map(
          reference =>
            this.normalizeSlotReference(
              reference,
              classes,
            ),
        ),
      acceptablePreferenceChangedSlots:
        observation
          .acceptablePreferenceChangedSlots
          .map(
            reference =>
              this.normalizeSlotReference(
                reference,
                classes,
              ),
          ),
      slotsForPossibleRemoval:
        observation.slotsForPossibleRemoval.map(
          reference =>
            this.normalizeSlotReference(
              reference,
              classes,
            ),
        ),
      matchSet: {
        assertions:
          observation.matchSet.assertions.map(
            assertion =>
              this.normalizeAssertion(
                assertion,
                classes,
              ),
          ),
        retractions:
          observation.matchSet.retractions.map(
            retraction =>
              this.normalizeRetraction(
                retraction,
                classes,
              ),
          ),
        nilGoalRetractions:
          observation.matchSet
            .nilGoalRetractions
            .map(
              retraction =>
                this.normalizeRetraction(
                  retraction,
                  classes,
                ),
            ),
      },
    })
  }

  private normalizeAssertion(
    assertion:
      QStructuralStateObservation['matchSet']['assertions'][number],
    classes: StructuralClasses,
  ) {
    return {
      type: assertion.type,
      productionName:
        assertion.productionName,
      matchGoal:
        assertion.matchGoal === null
          ? null
          : this.normalizeSymbol(
              assertion.matchGoal,
              classes,
            ),
      matchGoalLevel:
        assertion.matchGoalLevel,
      conditions:
        assertion.conditions.map(
          condition =>
            this.normalizeCondition(
              condition,
              classes,
            ),
        ),
      terminalWme:
        assertion.terminalWme === null
          ? null
          : this.normalizeElement(
              assertion.terminalWme,
              classes,
            ),
    }
  }

  private normalizeRetraction(
    retraction:
      QStructuralStateObservation['matchSet']['retractions'][number],
    classes: StructuralClasses,
  ) {
    return {
      productionName:
        retraction.productionName,
      matchGoal:
        retraction.matchGoal === null
          ? null
          : this.normalizeSymbol(
              retraction.matchGoal,
              classes,
            ),
      matchGoalLevel:
        retraction.matchGoalLevel,
      conditions:
        retraction.conditions.map(
          condition =>
            this.normalizeCondition(
              condition,
              classes,
            ),
        ),
      generatedPreferences:
        retraction.generatedPreferences.map(
          preference =>
            this.normalizePreference(
              preference,
              classes,
            ),
        ),
      inMatchSet:
        retraction.inMatchSet,
    }
  }

  private normalizeSlot(
    slot: QPreferenceSlotObservation,
    classes: StructuralClasses,
  ) {
    const preferencesByType =
      slot.preferencesByType.map(
        group => ({
          type: group.type,
          preferences:
            group.preferences.map(
              preference =>
                this.normalizePreference(
                  preference,
                  classes,
                ),
            ),
        }),
      )

    preferencesByType.sort(
      (left, right) =>
        left.type.localeCompare(right.type),
    )

    return {
      identifier:
        this.normalizeSymbol(
          slot.identifier,
          classes,
        ),
      attribute:
        this.normalizeSymbol(
          slot.attribute,
          classes,
        ),
      isaContextSlot: slot.isaContextSlot,
      impasseType: slot.impasseType,
      impasseId:
        slot.impasseId === null
          ? null
          : this.normalizeSymbol(
              slot.impasseId,
              classes,
            ),
      acceptablePreferenceChanged:
        slot.acceptablePreferenceChanged,
      changed: slot.changed,
      markedForPossibleRemoval:
        slot.markedForPossibleRemoval,
      preferences:
        slot.preferences.map(
          preference =>
            this.normalizePreference(
              preference,
              classes,
            ),
        ),
      preferencesByType,
      wmes:
        slot.wmes.map(
          element =>
            this.normalizeElement(
              element,
              classes,
            ),
        ),
      acceptablePreferenceWmes:
        slot.acceptablePreferenceWmes.map(
          element =>
            this.normalizeElement(
              element,
              classes,
            ),
        ),
    }
  }

  private normalizeProductionTest(
    test: QProductionTestObservation,
    classes: StructuralClasses,
  ): unknown {
    return {
      type: test.type,
      referent:
        test.referent === undefined
          ? null
          : this.normalizeSymbol(
              test.referent,
              classes,
            ),
      disjunction:
        test.disjunction === undefined
          ? null
          : test.disjunction.map(
              symbol =>
                this.normalizeSymbol(
                  symbol,
                  classes,
                ),
            ),
      conjuncts:
        test.conjuncts === undefined
          ? null
          : test.conjuncts.map(
              conjunct =>
                this.normalizeProductionTest(
                  conjunct,
                  classes,
                ),
            ),
    }
  }

  private normalizeCondition(
    condition: QInstantiatedConditionObservation,
    classes: StructuralClasses,
  ): unknown {
    if (
      condition.type ===
      'CONJUNCTIVE_NEGATION'
    ) {
      return {
        type: condition.type,
        conditions:
          condition.conditions.map(
            child =>
              this.normalizeCondition(
                child,
                classes,
              ),
          ),
      }
    }

    const normalized = {
      type: condition.type,
      identifierTest:
        this.normalizeProductionTest(
          condition.identifierTest,
          classes,
        ),
      attributeTest:
        this.normalizeProductionTest(
          condition.attributeTest,
          classes,
        ),
      valueTest:
        this.normalizeProductionTest(
          condition.valueTest,
          classes,
        ),
      acceptable: condition.acceptable,
    }

    if (condition.type === 'POSITIVE') {
      return {
        ...normalized,
        workingMemoryElement:
          condition.workingMemoryElement === null
            ? null
            : this.normalizeElement(
                condition.workingMemoryElement,
                classes,
              ),
      }
    }

    return normalized
  }

  private normalizePreference(
    preference: QPreferenceObservation,
    classes: StructuralClasses,
  ) {
    return {
      type: preference.type,
      identifier:
        this.normalizeSymbol(
          preference.identifier,
          classes,
        ),
      attribute:
        this.normalizeSymbol(
          preference.attribute,
          classes,
        ),
      value:
        this.normalizeSymbol(
          preference.value,
          classes,
        ),
      referent:
        preference.referent === null
          ? null
          : this.normalizeSymbol(
              preference.referent,
              classes,
            ),
      level: preference.level,
      numericValue: preference.numericValue,
      oSupported: preference.oSupported,
      inTemporaryMemory:
        preference.inTemporaryMemory,
      instantiationMatchGoalLevel:
        preference.instantiationMatchGoalLevel,
    }
  }

  private normalizeSlotReference(
    reference: {
      readonly identifier:
        StructuralStateSymbolObservation
      readonly attribute:
        StructuralStateSymbolObservation
    },
    classes: StructuralClasses,
  ) {
    return {
      identifier:
        this.normalizeSymbol(
          reference.identifier,
          classes,
        ),
      attribute:
        this.normalizeSymbol(
          reference.attribute,
          classes,
        ),
    }
  }

  private normalizeSymbol(
    symbol: StructuralStateSymbolObservation,
    classes: StructuralClasses,
  ): string {
    if (symbol.type === 'IDENTIFIER') {
      const structuralClass =
        classes.get(symbol.technicalId)

      if (structuralClass === undefined) {
        throw new Error(
          `Missing Q structural class for ${symbol.technicalId}`,
        )
      }

      return `IDENTIFIER:${structuralClass}`
    }

    return `${symbol.type}:${JSON.stringify(
      symbol.value,
    )}`
  }

  private normalizeElement(
    element: StructuralStateElementObservation,
    classes: StructuralClasses,
  ): {
    readonly identifier: string
    readonly attribute: string
    readonly value: string
    readonly acceptable: boolean
  } {
    return {
      identifier:
        this.normalizeSymbol(
          element.identifier,
          classes,
        ),
      attribute:
        this.normalizeSymbol(
          element.attribute,
          classes,
        ),
      value:
        this.normalizeSymbol(
          element.value,
          classes,
        ),
      acceptable:
        element.acceptable,
    }
  }

  private collectIdentifiers(
    observation: QStructuralStateObservation,
  ): readonly string[] {
    const identifiers = new Set<string>()

    const symbol = (
      value: StructuralStateSymbolObservation | null | undefined,
    ): void => {
      if (value?.type === 'IDENTIFIER') {
        identifiers.add(value.technicalId)
      }
    }

    const element = (
      value: StructuralStateElementObservation | null,
    ): void => {
      if (value === null) return
      symbol(value.identifier)
      symbol(value.attribute)
      symbol(value.value)
    }

    const preference = (
      value: QPreferenceObservation,
    ): void => {
      symbol(value.identifier)
      symbol(value.attribute)
      symbol(value.value)
      symbol(value.referent)
    }

    const productionTest = (
      value: QProductionTestObservation,
    ): void => {
      symbol(value.referent)

      for (const item of value.disjunction ?? []) {
        symbol(item)
      }

      for (const conjunct of value.conjuncts ?? []) {
        productionTest(conjunct)
      }
    }

    const condition = (
      value: QInstantiatedConditionObservation,
    ): void => {
      if (value.type === 'CONJUNCTIVE_NEGATION') {
        for (const child of value.conditions) {
          condition(child)
        }
        return
      }

      productionTest(value.identifierTest)
      productionTest(value.attributeTest)
      productionTest(value.valueTest)

      if (value.type === 'POSITIVE') {
        element(value.workingMemoryElement)
      }
    }

    const slot = (
      value: QPreferenceSlotObservation,
    ): void => {
      symbol(value.identifier)
      symbol(value.attribute)
      symbol(value.impasseId)

      for (const item of value.preferences) {
        preference(item)
      }

      for (const group of value.preferencesByType) {
        for (const item of group.preferences) {
          preference(item)
        }
      }

      for (const item of value.wmes) {
        element(item)
      }

      for (const item of value.acceptablePreferenceWmes) {
        element(item)
      }
    }

    for (const item of observation.workingMemory) {
      element(item)
    }

    for (const item of observation.preferenceSlots) {
      slot(item)
    }

    for (const queue of [
      observation.changedSlots,
      observation.acceptablePreferenceChangedSlots,
      observation.slotsForPossibleRemoval,
    ]) {
      for (const reference of queue) {
        symbol(reference.identifier)
        symbol(reference.attribute)
      }
    }

    for (const assertion of observation.matchSet.assertions) {
      symbol(assertion.matchGoal)

      for (const item of assertion.conditions) {
        condition(item)
      }

      element(assertion.terminalWme)
    }

    for (const retraction of [
      ...observation.matchSet.retractions,
      ...observation.matchSet.nilGoalRetractions,
    ]) {
      symbol(retraction.matchGoal)

      for (const item of retraction.conditions) {
        condition(item)
      }

      for (const item of retraction.generatedPreferences) {
        preference(item)
      }
    }

    return [...identifiers]
  }
}
