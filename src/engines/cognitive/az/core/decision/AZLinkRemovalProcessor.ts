import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalStateRegistry } from '../state/AZGoalStateRegistry'
import type { AZIdentifierLinkStateRegistry } from '../state/AZIdentifierLinkStateRegistry'
import type { AZImpasseStateRegistry } from '../state/AZImpasseStateRegistry'

export type AZLinkUpdateMode =
  | 'UPDATE_LINKS_NORMALLY'
  | 'JUST_UPDATE_COUNT'
  | 'UPDATE_DISCONNECTED_IDS_LIST'

export interface AZLinkRemovalProcessor {
  setLinkUpdateMode(
    mode: AZLinkUpdateMode,
  ): void

  post(
    from: AZSymbol | null,
    to: AZSymbol,
  ): void

  addUnknownLevelIdentifier(
    identifier: AZSymbol,
  ): void

  removeUnknownLevelIdentifier(
    identifier: AZSymbol,
  ): boolean

  getUnknownLevelIdentifiers():
    readonly AZSymbol[]

  getDisconnectedIdentifiers():
    readonly AZSymbol[]

  moveUnknownLevelIdentifierToDisconnected(
    identifier: AZSymbol,
  ): void

  takeNextUnknownLevelIdentifier():
    AZSymbol | null

  takeNextDisconnectedIdentifier():
    AZSymbol | null
}

export class AZDefaultLinkRemovalProcessor
  implements AZLinkRemovalProcessor
{
  private readonly unknownLevelIdentifiers:
    AZSymbol[] = []

  private readonly disconnectedIdentifiers:
    AZSymbol[] = []

  private linkUpdateMode:
    AZLinkUpdateMode =
      'UPDATE_LINKS_NORMALLY'

  public constructor(
    private readonly states:
      AZIdentifierLinkStateRegistry,

    private readonly goals:
      AZGoalStateRegistry,

    private readonly impasses:
      AZImpasseStateRegistry,
  ) {}

  public setLinkUpdateMode(
    mode: AZLinkUpdateMode,
  ): void {
    this.linkUpdateMode = mode
  }

  public post(
    from: AZSymbol | null,
    to: AZSymbol,
  ): void {
    if (
      from !== null &&
      (
        this.goals.isGoal(to) ||
        this.impasses.isImpasse(to)
      )
    ) {
      return
    }

    const toState =
      this.states.get(to)

    toState.linkCount -= 1

    if (
      this.linkUpdateMode ===
      'JUST_UPDATE_COUNT'
    ) {
      return
    }

    if (
      this.linkUpdateMode ===
      'UPDATE_DISCONNECTED_IDS_LIST' &&
      toState.linkCount === 0
    ) {
      this.removeUnknownLevelIdentifier(to)

      if (
        !this.disconnectedIdentifiers.includes(
          to,
        )
      ) {
        this.disconnectedIdentifiers.unshift(
          to,
        )
      }

      return
    }

    if (from !== null) {
      const fromState =
        this.states.get(from)

      if (
        fromState.level !==
        toState.level
      ) {
        return
      }
    }

    this.addUnknownLevelIdentifier(to)
  }

  public addUnknownLevelIdentifier(
    identifier: AZSymbol,
  ): void {
    if (
      this.unknownLevelIdentifiers.includes(
        identifier,
      )
    ) {
      return
    }

    this.unknownLevelIdentifiers.unshift(
      identifier,
    )
  }

  public removeUnknownLevelIdentifier(
    identifier: AZSymbol,
  ): boolean {
    const index =
      this.unknownLevelIdentifiers.indexOf(
        identifier,
      )

    if (index === -1) {
      return false
    }

    this.unknownLevelIdentifiers.splice(
      index,
      1,
    )

    return true
  }

  public getUnknownLevelIdentifiers():
    readonly AZSymbol[] {
    return this.unknownLevelIdentifiers
  }

  public getDisconnectedIdentifiers():
    readonly AZSymbol[] {
    return this.disconnectedIdentifiers
  }

  public moveUnknownLevelIdentifierToDisconnected(
    identifier: AZSymbol,
  ): void {
    if (
      !this.removeUnknownLevelIdentifier(
        identifier,
      )
    ) {
      return
    }

    if (
      !this.disconnectedIdentifiers.includes(
        identifier,
      )
    ) {
      this.disconnectedIdentifiers.unshift(
        identifier,
      )
    }
  }

  public takeNextUnknownLevelIdentifier():
    AZSymbol | null {
    return (
      this.unknownLevelIdentifiers.shift() ??
      null
    )
  }

  public takeNextDisconnectedIdentifier():
    AZSymbol | null {
    return (
      this.disconnectedIdentifiers.shift() ??
      null
    )
  }
}
