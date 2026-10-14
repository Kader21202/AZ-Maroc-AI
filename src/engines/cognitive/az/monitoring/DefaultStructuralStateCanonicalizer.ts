import type {
  StructuralStateElementObservation,
  StructuralStateObservation,
  StructuralStateSymbolObservation,
} from './StructuralStateObservation'
import type { StructuralStateCanonicalizer } from './StructuralStateCanonicalizer'

type StructuralClasses =
  ReadonlyMap<string, string>

export class DefaultStructuralStateCanonicalizer
  implements StructuralStateCanonicalizer
{
  public canonicalize(
    observation: StructuralStateObservation,
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
    observation: StructuralStateObservation,
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
            `Missing structural class for ${identifier}`,
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
        'Unable to canonicalize structural state',
      )
    }

    return best
  }

  private refineClasses(
    observation: StructuralStateObservation,
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
            `Missing signature for ${identifier}`,
          )
        }

        const structuralClass =
          signatureClasses.get(signature)

        if (structuralClass === undefined) {
          throw new Error(
            `Missing class for signature ${signature}`,
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

        if (
          sameOnLeft !==
          sameOnRight
        ) {
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
          `Missing structural class for ${identifier}`,
        )
      }

      const members =
        membersByClass.get(
          structuralClass,
        ) ?? []

      members.push(identifier)

      membersByClass.set(
        structuralClass,
        members,
      )
    }

    const ambiguous =
      Array.from(
        membersByClass.entries(),
      )
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
    observation: StructuralStateObservation,
    classes: StructuralClasses,
  ): string {
    const ownClass =
      classes.get(identifier)

    if (ownClass === undefined) {
      throw new Error(
        `Missing structural class for ${identifier}`,
      )
    }

    const relations: string[] = []

    for (const element of observation.elements) {
      if (
        element.identifier.type ===
          'IDENTIFIER' &&
        element.identifier.technicalId ===
          identifier
      ) {
        relations.push(
          JSON.stringify({
            role: 'IDENTIFIER',
            attribute:
              this.normalizeForSignature(
                element.attribute,
                classes,
              ),
            value:
              this.normalizeForSignature(
                element.value,
                classes,
              ),
            acceptable:
              element.acceptable,
          }),
        )
      }

      if (
        element.attribute.type ===
          'IDENTIFIER' &&
        element.attribute.technicalId ===
          identifier
      ) {
        relations.push(
          JSON.stringify({
            role: 'ATTRIBUTE',
            identifier:
              this.normalizeForSignature(
                element.identifier,
                classes,
              ),
            value:
              this.normalizeForSignature(
                element.value,
                classes,
              ),
            acceptable:
              element.acceptable,
          }),
        )
      }

      if (
        element.value.type ===
          'IDENTIFIER' &&
        element.value.technicalId ===
          identifier
      ) {
        relations.push(
          JSON.stringify({
            role: 'VALUE',
            identifier:
              this.normalizeForSignature(
                element.identifier,
                classes,
              ),
            attribute:
              this.normalizeForSignature(
                element.attribute,
                classes,
              ),
            acceptable:
              element.acceptable,
          }),
        )
      }
    }

    relations.sort()

    return JSON.stringify({
      ownClass,
      relations,
    })
  }

  private serialize(
    observation: StructuralStateObservation,
    classes: StructuralClasses,
  ): string {
    const normalized =
      observation.elements.map(
        (element) =>
          this.normalizeElement(
            element,
            classes,
          ),
      )

    normalized.sort(
      (left, right) =>
        JSON.stringify(left).localeCompare(
          JSON.stringify(right),
        ),
    )

    return JSON.stringify(normalized)
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
        this.normalizeForSerialization(
          element.identifier,
          classes,
        ),
      attribute:
        this.normalizeForSerialization(
          element.attribute,
          classes,
        ),
      value:
        this.normalizeForSerialization(
          element.value,
          classes,
        ),
      acceptable:
        element.acceptable,
    }
  }

  private normalizeForSignature(
    symbol: StructuralStateSymbolObservation,
    classes: StructuralClasses,
  ): string {
    if (symbol.type === 'IDENTIFIER') {
      const structuralClass =
        classes.get(
          symbol.technicalId,
        )

      if (structuralClass === undefined) {
        throw new Error(
          `Missing structural class for ${symbol.technicalId}`,
        )
      }

      return `IDENTIFIER:${structuralClass}`
    }

    return this.normalizeConstant(symbol)
  }

  private normalizeForSerialization(
    symbol: StructuralStateSymbolObservation,
    classes: StructuralClasses,
  ): string {
    if (symbol.type === 'IDENTIFIER') {
      const structuralClass =
        classes.get(
          symbol.technicalId,
        )

      if (structuralClass === undefined) {
        throw new Error(
          `Missing structural class for ${symbol.technicalId}`,
        )
      }

      return `IDENTIFIER:${structuralClass}`
    }

    return this.normalizeConstant(symbol)
  }

  private normalizeConstant(
    symbol: Exclude<
      StructuralStateSymbolObservation,
      {
        readonly type: 'IDENTIFIER'
        readonly technicalId: string
      }
    >,
  ): string {
    return `${symbol.type}:${JSON.stringify(
      symbol.value,
    )}`
  }

  private collectIdentifiers(
    observation: StructuralStateObservation,
  ): string[] {
    const identifiers =
      new Set<string>()

    for (const element of observation.elements) {
      this.collectIdentifier(
        element.identifier,
        identifiers,
      )

      this.collectIdentifier(
        element.attribute,
        identifiers,
      )

      this.collectIdentifier(
        element.value,
        identifiers,
      )
    }

    return Array.from(identifiers)
  }

  private collectIdentifier(
    symbol: StructuralStateSymbolObservation,
    identifiers: Set<string>,
  ): void {
    if (symbol.type === 'IDENTIFIER') {
      identifiers.add(
        symbol.technicalId,
      )
    }
  }
}
