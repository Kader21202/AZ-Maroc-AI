import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'
import { AZDefaultReteLocationResolver } from './AZDefaultReteLocationResolver'
import type { AZProductionRhsValue } from './AZProductionRhsValue'
import type { AZReteLocationResolver } from './AZReteLocationResolver'
import type { AZRhsFunctionRegistry } from './AZRhsFunctionRegistry'
import type { AZRhsInstantiationContext } from './AZRhsInstantiationContext'
import type { AZToken } from './AZToken'
import type { AZReteFieldNumber } from './AZVariableLocation'

export class AZRhsValueInstantiator {
  private readonly reteLocationResolver:
    AZReteLocationResolver =
      new AZDefaultReteLocationResolver()

  public constructor(
    private readonly symbolManager:
      AZSymbolManager,

    private readonly identifierStateRegistry:
      AZIdentifierLinkStateRegistry,

    private readonly rhsFunctionRegistry:
      AZRhsFunctionRegistry | null = null,
  ) {}

  public instantiate(
    value: AZProductionRhsValue,
    token: AZToken,
    currentWme:
      AZWorkingMemoryElement | null,
    newIdentifierLevel: number,
    context: AZRhsInstantiationContext,
    usage: 'VALUE' | 'STANDALONE' =
      'VALUE',
  ): AZSymbol | null {
    switch (value.type) {
      case 'SYMBOL': {
        const symbol = value.symbol

        if (
          symbol.type === 'IDENTIFIER' &&
          !this.identifierStateRegistry.has(symbol) &&
          newIdentifierLevel >= 0
        ) {
          this.identifierStateRegistry.register(
            symbol,
            {
              level: newIdentifierLevel,
              promotionLevel:
                newIdentifierLevel,
            },
          )
        }

        return symbol
      }

      case 'RETE_LOCATION':
        return this.reteLocationResolver.resolve(
          token,
          currentWme,
          value.levelsUp,
          this.requireFieldNumber(
            value.fieldNumber,
          ),
        )

      case 'UNBOUND_VARIABLE': {
        const existing =
          context.unboundVariableBindings.get(
            value.index,
          )

        if (existing !== undefined) {
          return existing
        }

        const identifier =
          this.symbolManager.makeIdentifier('I')

        this.identifierStateRegistry.register(
          identifier,
          {
            level: newIdentifierLevel,
            promotionLevel:
              newIdentifierLevel,
          },
        )

        context.unboundVariableBindings.set(
          value.index,
          identifier,
        )

        return identifier
      }

      case 'FUNCALL': {
        if (
          this.rhsFunctionRegistry === null
        ) {
          return null
        }

        const function_ =
          this.rhsFunctionRegistry.lookup(
            value.functionName,
          )

        if (function_ === null) {
          return null
        }

        if (
          usage === 'VALUE' &&
          !function_.canBeRhsValue
        ) {
          return null
        }

        if (
          usage === 'STANDALONE' &&
          !function_.canBeStandaloneAction
        ) {
          return null
        }

        const arguments_: AZSymbol[] = []

        for (
          const argument of
          value.arguments
        ) {
          const instantiated =
            this.instantiate(
              argument,
              token,
              currentWme,
              newIdentifierLevel,
              context,
              'VALUE',
            )

          if (instantiated === null) {
            return null
          }

          arguments_.push(instantiated)
        }

        if (
          function_.numArgsExpected !== -1 &&
          function_.numArgsExpected !==
            arguments_.length
        ) {
          return null
        }

        return function_.execute(
          arguments_,
        )
      }
    }
  }

  private requireFieldNumber(
    fieldNumber: number,
  ): AZReteFieldNumber {
    if (
      fieldNumber !== 0 &&
      fieldNumber !== 1 &&
      fieldNumber !== 2
    ) {
      throw new Error(
        `Invalid RETE field number: ${fieldNumber}`,
      )
    }

    return fieldNumber
  }
}


