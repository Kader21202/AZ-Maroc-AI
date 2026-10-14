import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZPreference } from '../operator/AZPreference'
import { isAZBinaryPreferenceType } from '../operator/AZPreferenceTypeSemantics'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'
import type { AZInstantiation } from './AZInstantiation'
import type { AZProductionAction } from './AZProductionAction'
import type { AZProductionPreferenceType } from './AZProductionPreferenceType'
import type { AZRhsFunctionRegistry } from './AZRhsFunctionRegistry'
import type { AZRhsInstantiationContext } from './AZRhsInstantiationContext'
import { AZRhsValueInstantiator } from './AZRhsValueInstantiator'
import type { AZToken } from './AZToken'

export class AZProductionActionExecutor {
  private readonly rhsValueInstantiator:
    AZRhsValueInstantiator

  public constructor(
    symbolManager: AZSymbolManager,
    private readonly identifierStateRegistry:
      AZIdentifierLinkStateRegistry,
    rhsFunctionRegistry:
      AZRhsFunctionRegistry | null = null,
  ) {
    this.rhsValueInstantiator =
      new AZRhsValueInstantiator(
        symbolManager,
        identifierStateRegistry,
        rhsFunctionRegistry,
      )
  }

  public execute(
    action: AZProductionAction,
    token: AZToken,
    currentWme:
      AZWorkingMemoryElement | null,
    instantiation: AZInstantiation,
    context: AZRhsInstantiationContext,
  ): AZPreference | null {
    if (action.type === 'FUNCALL') {
      this.rhsValueInstantiator
        .instantiate(
          action.functionCall,
          token,
          currentWme,
          -1,
          context,
          'STANDALONE',
        )

      return null
    }

    const identifier =
      this.rhsValueInstantiator
        .instantiate(
          action.identifier,
          token,
          currentWme,
          -1,
          context,
        )

    if (
      identifier === null ||
      identifier.type !== 'IDENTIFIER'
    ) {
      return null
    }

    const level =
      this.requireIdentifierLevel(
        identifier,
      )

    const attribute =
      this.rhsValueInstantiator
        .instantiate(
          action.attribute,
          token,
          currentWme,
          level,
          context,
        )

    if (attribute === null) {
      return null
    }

    const value =
      this.rhsValueInstantiator
        .instantiate(
          action.value,
          token,
          currentWme,
          level,
          context,
        )

    if (value === null) {
      return null
    }

    let referent:
      AZSymbol | null = null

    if (
      isAZBinaryPreferenceType(action.preferenceType)
    ) {
      if (
        action.referent === undefined
      ) {
        return null
      }

      referent =
        this.rhsValueInstantiator
          .instantiate(
            action.referent,
            token,
            currentWme,
            level,
            context,
          )

      if (referent === null) {
        return null
      }
    }

    const preference:
      AZPreference = {
        type: action.preferenceType,
        identifier,
        attribute,
        value,
        referent,
        level,
        numericValue: 0,
        oSupported:
          this.resolveOSupport(
            instantiation,
            context,
          ),
        inTemporaryMemory: false,
        slot: null,
        instantiation,
      }

    instantiation.generatedPreferences.push(
      preference,
    )

    return preference
  }

  private requireIdentifierLevel(
    identifier: AZSymbol,
  ): number {
    if (
      !this.identifierStateRegistry.has(
        identifier,
      )
    ) {
      throw new Error(
        'RHS identifier link state is not registered',
      )
    }

    return this.identifierStateRegistry
      .get(identifier)
      .level
  }

  private resolveOSupport(
    instantiation: AZInstantiation,
    context: AZRhsInstantiationContext,
  ): boolean {
    const production =
      instantiation.production

    if (production === null) {
      throw new Error(
        'Architectural instantiation cannot execute production actions',
      )
    }

    switch (
      production.declaredSupport
    ) {
      case 'O_SUPPORT':
        return true

      case 'I_SUPPORT':
        return false

      case 'UNDECLARED':
        if (
          context.assertionType ===
          undefined
        ) {
          throw new Error(
            'UNDECLARED production firing requires assertionType',
          )
        }

        return (
          context.assertionType ===
          'O_ASSERTION'
        )
    }
  }

  private isBinaryPreference(
    type: AZProductionPreferenceType,
  ): boolean {
    return (
      type === 'BINARY_INDIFFERENT' ||
      type === 'BINARY_PARALLEL' ||
      type === 'BETTER' ||
      type === 'WORSE' ||
      type === 'NUMERIC_INDIFFERENT'
    )
  }
}
