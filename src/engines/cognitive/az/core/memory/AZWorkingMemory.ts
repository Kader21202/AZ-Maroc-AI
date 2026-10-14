import type { AZLinkAdditionProcessor } from '../decision/AZLinkAdditionProcessor'
import type { AZLinkRemovalProcessor } from '../decision/AZLinkRemovalProcessor'
import type { AZOutputLinkManager } from '../io/AZOutputLinkManager'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZWorkingMemoryElement } from './AZWorkingMemoryElement'
import type { AZWorkingMemoryPropagation } from './AZWorkingMemoryPropagation'

export class AZWorkingMemory {
  private readonly elements =
    new Map<number, AZWorkingMemoryElement>()

  private readonly pendingAdditions:
    AZWorkingMemoryElement[] = []

  private readonly pendingRemovals:
    AZWorkingMemoryElement[] = []

  private readonly afterBufferedChanges:
    Array<() => void> = []

  private nextTimetag = 1

  private propagation:
    AZWorkingMemoryPropagation | null = null

  public constructor(
    private readonly linkAdditionProcessor?:
      AZLinkAdditionProcessor,

    private readonly linkRemovalProcessor?:
      AZLinkRemovalProcessor,

    private readonly outputLinkManager?:
      AZOutputLinkManager,
  ) {}

  public createElement(
    identifier: AZSymbol,
    attribute: AZSymbol,
    value: AZSymbol,
    acceptable = false,
  ): AZWorkingMemoryElement {
    const element: AZWorkingMemoryElement = {
      timetag: this.nextTimetag,
      identifier,
      attribute,
      value,
      acceptable,
    }

    this.nextTimetag += 1

    return element
  }

  public scheduleAdd(
    element: AZWorkingMemoryElement,
  ): void {
    this.pendingAdditions.push(element)

    if (
      element.identifier.type ===
      'IDENTIFIER' &&
      element.value.type ===
      'IDENTIFIER'
    ) {
      this.linkAdditionProcessor?.post(
        element.identifier,
        element.value,
      )
    }

    this.outputLinkManager?.postAddition(
      element,
    )
  }

  public scheduleRemove(
    element: AZWorkingMemoryElement,
  ): void {
    const b0Step = (globalThis as any).__AZ_B0_STEP__
    if (b0Step >= 525023 && b0Step <= 525028) console.log('B0-SCHEDULE-REMOVE:', JSON.stringify({ step: b0Step, timetag: element.timetag, id: element.identifier.value, attribute: element.attribute.value, value: element.value.value, acceptable: element.acceptable }))
    if (
      this.pendingRemovals.some(
        pending => pending.timetag === element.timetag,
      )
    ) {
      return
    }

    this.pendingRemovals.push(element)

    if (
      element.identifier.type ===
      'IDENTIFIER' &&
      element.value.type ===
      'IDENTIFIER'
    ) {
      this.linkRemovalProcessor?.post(
        element.identifier,
        element.value,
      )
    }

    this.outputLinkManager?.postRemoval(
      element,
    )
  }

  public scheduleAfterBufferedChanges(
    callback: () => void,
  ): void {
    this.afterBufferedChanges.push(callback)
  }

  public applyBufferedChanges(): void {
    for (const element of this.pendingAdditions) {
      this.elements.set(
        element.timetag,
        element,
      )

      if ((globalThis as any).__AZ_B0_20533__) console.log('20533-R add-before', { timetag: element.timetag, additions: this.pendingAdditions.length, removals: this.pendingRemovals.length })
      this.propagation?.onAdded(element)
      if ((globalThis as any).__AZ_B0_20533__) console.log('20533-S add-after', { timetag: element.timetag, additions: this.pendingAdditions.length, removals: this.pendingRemovals.length })
    }

    for (const element of this.pendingRemovals) {
      this.elements.delete(
        element.timetag,
      )

      if ((globalThis as any).__AZ_B0_20533__) console.log('20533-T remove-before', { timetag: element.timetag, additions: this.pendingAdditions.length, removals: this.pendingRemovals.length })
      this.propagation?.onRemoved(element)
      if ((globalThis as any).__AZ_B0_20533__) console.log('20533-U remove-after', { timetag: element.timetag, additions: this.pendingAdditions.length, removals: this.pendingRemovals.length })
    }

    for (const element of this.pendingAdditions) {
      this.outputLinkManager?.postWmeChange(
        element,
        this,
      )
    }

    for (const element of this.pendingRemovals) {
      this.outputLinkManager?.postWmeChange(
        element,
        this,
      )
    }

    this.pendingAdditions.length = 0
    this.pendingRemovals.length = 0

    const finalizers =
      this.afterBufferedChanges.splice(0)

    for (const finalize of finalizers) {
      finalize()
    }
  }
  public setPropagation(
    propagation:
      AZWorkingMemoryPropagation | null,
  ): void {
    this.propagation = propagation
  }

  public getElements():
    readonly AZWorkingMemoryElement[] {
    return Array.from(
      this.elements.values(),
    )
  }
}
