import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZProduction } from './AZProduction'
import { AZDefaultProductionRhsIdentifierResolver } from './AZDefaultProductionRhsIdentifierResolver'
import type { AZProductionRhsIdentifierResolver } from './AZProductionRhsIdentifierResolver'
import type { AZToken } from './AZToken'

export interface AZInstantiationFiringContext {
  readonly activeLevel: number
  readonly highestActiveLevel: number
  readonly changeLevel: number
}

export interface AZInstantiationFiringPolicy {
  shouldCreate(
    production: AZProduction,
    token: AZToken,
    currentWme:
      AZWorkingMemoryElement | null,
    context: AZInstantiationFiringContext,
  ): boolean
}

export class AZDefaultInstantiationFiringPolicy
  implements AZInstantiationFiringPolicy
{
  private readonly rhsIdentifierResolver:
    AZProductionRhsIdentifierResolver =
      new AZDefaultProductionRhsIdentifierResolver()

  public constructor(
    private readonly identifierStateRegistry:
      AZIdentifierLinkStateRegistry,
  ) {}

  public shouldCreate(
    production: AZProduction,
    token: AZToken,
    currentWme:
      AZWorkingMemoryElement | null,
    context: AZInstantiationFiringContext,
  ): boolean {
    if (
      context.activeLevel ===
      context.highestActiveLevel
    ) {
      return true
    }

    for (const action of production.actions) {
      if (action.type === 'FUNCALL') {
        continue
      }

      const rhsIdentifier =
        action.identifier

      if (
        rhsIdentifier.type ===
        'UNBOUND_VARIABLE'
      ) {
        continue
      }

      let identifier = null

      if (
        rhsIdentifier.type === 'SYMBOL'
      ) {
        identifier =
          rhsIdentifier.symbol
      } else if (
        rhsIdentifier.type ===
        'RETE_LOCATION'
      ) {
        if (currentWme === null) {
          throw new Error(
            'RETE_LOCATION firing check requires current WME',
          )
        }

        identifier =
          this.rhsIdentifierResolver.resolve(
            rhsIdentifier,
            token,
            currentWme,
          )
      } else {
        continue
      }

      if (
        identifier === null ||
        identifier.type !== 'IDENTIFIER'
      ) {
        continue
      }

      if (
        !this.identifierStateRegistry.has(
          identifier,
        )
      ) {
        throw new Error(
          'RHS identifier level is not registered',
        )
      }

      if (
        this.identifierStateRegistry
          .get(identifier)
          .level <= context.changeLevel
      ) {
        return false
      }
    }

    return true
  }
}
