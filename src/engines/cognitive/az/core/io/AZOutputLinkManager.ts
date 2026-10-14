import type { AZWorkingMemory } from '../memory/AZWorkingMemory'
import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZIoState } from './AZIoState'
import type { AZOutputLink } from './AZOutputLink'
import {
  AZOutputLinkTransitiveClosureCalculator,
} from './AZOutputLinkTransitiveClosureCalculator'

export class AZOutputLinkManager {
  private readonly outputLinks:
    AZOutputLink[] = []

  private readonly outputLinkByWme =
    new Map<AZWorkingMemoryElement, AZOutputLink>()

  private readonly transitiveClosureCalculator =
    new AZOutputLinkTransitiveClosureCalculator()

  public constructor(
    private readonly ioState: AZIoState,
  ) {}

  public postAddition(
    wme: AZWorkingMemoryElement,
  ): AZOutputLink | null {
    const outputLinkIdentifier =
      this.ioState.outputLink

    if (
      outputLinkIdentifier === null ||
      wme.identifier !== outputLinkIdentifier
    ) {
      return null
    }

    const existing =
      this.outputLinkByWme.get(wme)

    if (existing !== undefined) {
      return existing
    }

    const outputLink: AZOutputLink = {
      status: 'NEW',
      linkWme: wme,
      idsInTc: [],
    }

    this.outputLinkByWme.set(
      wme,
      outputLink,
    )

    this.outputLinks.push(
      outputLink,
    )

    this.ioState.outputLinkChanged =
      true

    return outputLink
  }

  public postRemoval(
    wme: AZWorkingMemoryElement,
  ): boolean {
    const outputLink =
      this.outputLinkByWme.get(wme)

    if (outputLink === undefined) {
      return false
    }

    outputLink.status =
      'REMOVED'

    this.ioState.outputLinkChanged =
      true

    return true
  }

  public refresh(
    outputLink: AZOutputLink,
    workingMemory: AZWorkingMemory,
  ): boolean {
    if (
      !this.outputLinks.includes(outputLink) ||
      outputLink.status === 'REMOVED'
    ) {
      return false
    }

    const nextIds =
      this.transitiveClosureCalculator
        .calculate(
          outputLink,
          workingMemory,
        )

    const sameClosure =
      this.hasSameIdentifiers(
        outputLink.idsInTc,
        nextIds,
      )

    outputLink.idsInTc.length = 0

    outputLink.idsInTc.push(
      ...nextIds,
    )

    if (outputLink.status !== 'NEW') {
      outputLink.status =
        sameClosure
          ? 'MODIFIED_BUT_SAME_TC'
          : 'MODIFIED'
    }

    this.ioState.outputLinkChanged =
      true

    return true
  }

  public postWmeChange(
    wme: AZWorkingMemoryElement,
    workingMemory: AZWorkingMemory,
  ): void {
    for (const outputLink of this.outputLinks) {
      if (outputLink.status === 'REMOVED') {
        continue
      }

      const initializesNewLink =
        outputLink.status === 'NEW' &&
        outputLink.linkWme === wme

      if (initializesNewLink) {
        this.refresh(
          outputLink,
          workingMemory,
        )
        continue
      }

      if (
        !outputLink.idsInTc.includes(
          wme.identifier,
        )
      ) {
        continue
      }

      if (wme.value.type === 'IDENTIFIER') {
        this.refresh(
          outputLink,
          workingMemory,
        )

        if (outputLink.status !== 'NEW') {
          outputLink.status = 'MODIFIED'
        }

        continue
      }

      if (outputLink.status === 'UNCHANGED') {
        outputLink.status =
          'MODIFIED_BUT_SAME_TC'

        this.ioState.outputLinkChanged =
          true
      }
    }
  }

  public refreshAll(
    workingMemory: AZWorkingMemory,
  ): void {
    for (const outputLink of this.outputLinks) {
      if (outputLink.status === 'REMOVED') {
        continue
      }

      this.refresh(
        outputLink,
        workingMemory,
      )
    }
  }

  public markProcessed(
    outputLink: AZOutputLink,
  ): boolean {
    if (
      !this.outputLinks.includes(outputLink) ||
      outputLink.status === 'REMOVED'
    ) {
      return false
    }

    outputLink.status =
      'UNCHANGED'

    return true
  }

  public removeProcessed(
    outputLink: AZOutputLink,
  ): boolean {
    const index =
      this.outputLinks.indexOf(outputLink)

    if (
      index < 0 ||
      outputLink.status !== 'REMOVED'
    ) {
      return false
    }

    this.outputLinks.splice(
      index,
      1,
    )

    if (
      this.outputLinkByWme.get(
        outputLink.linkWme,
      ) === outputLink
    ) {
      this.outputLinkByWme.delete(
        outputLink.linkWme,
      )
    }

    return true
  }

  public getOutputLinks():
    readonly AZOutputLink[] {
    return this.outputLinks
  }

  private hasSameIdentifiers(
    current: readonly AZOutputLink['idsInTc'][number][],
    next: readonly AZOutputLink['idsInTc'][number][],
  ): boolean {
    if (current.length !== next.length) {
      return false
    }

    return current.every(
      (identifier) =>
        next.includes(identifier),
    )
  }
}
