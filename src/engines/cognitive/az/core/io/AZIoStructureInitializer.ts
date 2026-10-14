import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZPredefinedSymbols } from '../symbols/AZPredefinedSymbols'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZSymbolManager } from '../symbols/AZSymbolManager'
import type { AZInputWmeManager } from './AZInputWmeManager'
import type { AZIoState } from './AZIoState'

export class AZIoStructureInitializer {
  public constructor(
    private readonly symbolManager:
      AZSymbolManager,

    private readonly predefinedSymbols:
      AZPredefinedSymbols,

    private readonly inputWmeManager:
      AZInputWmeManager,

    private readonly identifierStateRegistry:
      AZIdentifierLinkStateRegistry,
  ) {}

  public initialize(
    topGoal: AZSymbol,
    ioState: AZIoState,
  ): void {
    if (
      topGoal.type !==
      'IDENTIFIER'
    ) {
      throw new Error(
        'AZ top goal must be an identifier',
      )
    }

    if (
      ioState.ioHeader !== null ||
      ioState.inputLink !== null ||
      ioState.outputLink !== null ||
      ioState.ioHeaderLink !== null
    ) {
      throw new Error(
        'AZ IO structure is already initialized',
      )
    }

    const topGoalState =
      this.identifierStateRegistry.get(
        topGoal,
      )

    const level =
      topGoalState.level

    const ioHeader =
      this.symbolManager.makeIdentifier(
        'I',
      )

    const inputLink =
      this.symbolManager.makeIdentifier(
        'I',
      )

    const outputLink =
      this.symbolManager.makeIdentifier(
        'I',
      )

    this.identifierStateRegistry.register(
      ioHeader,
      {
        level,
        promotionLevel: level,
      },
    )

    this.identifierStateRegistry.register(
      inputLink,
      {
        level,
        promotionLevel: level,
      },
    )

    this.identifierStateRegistry.register(
      outputLink,
      {
        level,
        promotionLevel: level,
      },
    )

    const ioHeaderLink =
      this.inputWmeManager.add(
        topGoal,
        this.predefinedSymbols.io,
        ioHeader,
      )

    this.inputWmeManager.add(
      ioHeader,
      this.predefinedSymbols.inputLink,
      inputLink,
    )

    this.inputWmeManager.add(
      ioHeader,
      this.predefinedSymbols.outputLink,
      outputLink,
    )

    ioState.ioHeader =
      ioHeader

    ioState.inputLink =
      inputLink

    ioState.outputLink =
      outputLink

    ioState.ioHeaderLink =
      ioHeaderLink
  }
}
