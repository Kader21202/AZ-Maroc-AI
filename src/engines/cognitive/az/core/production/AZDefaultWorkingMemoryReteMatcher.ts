import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZAlphaMemoryManager } from './AZAlphaMemoryManager'
import type { AZMatchSet } from './AZMatchSet'
import type { AZReteActivationEngine } from './AZReteActivationEngine'
import type { AZWorkingMemoryReteMatcher } from './AZWorkingMemoryReteMatcher'

export class AZDefaultWorkingMemoryReteMatcher
  implements AZWorkingMemoryReteMatcher
{
  public constructor(
    private readonly alphaMemoryManager:
      AZAlphaMemoryManager,
    private readonly reteActivationEngine:
      AZReteActivationEngine,
    private readonly matchSet:
      AZMatchSet,
  ) {}

  public addWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): void {
    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-Y before alpha add', element.timetag)
    const matchedAlphaMemories =
      this.alphaMemoryManager
        .addWorkingMemoryElement(
          element,
        )

    if ((globalThis as any).__AZ_B0_20533__) console.log('20533-Z after alpha add', element.timetag, 'matched', matchedAlphaMemories.length)

    for (
      const alphaMemory of
      matchedAlphaMemories
    ) {
      for (
        const node of
        [...alphaMemory.getBetaNodes()]
      ) {
        switch (node.type) {
          case 'POSITIVE':
          case 'UNHASHED_POSITIVE':
            if ((globalThis as any).__AZ_B0_20533__) console.log('20533-AA', { timetag: element.timetag, nodeId: node.nodeId, type: node.type, parentId: node.parent?.nodeId, parentType: node.parent?.type, leftUnlinked: node.leftUnlinked, rightUnlinked: node.rightUnlinked, children: node.children.length, childInfo: node.children.map(c => ({ nodeId: c.nodeId, type: c.type, children: c.children.length })), tests: node.tests.length })
            this.reteActivationEngine
              .activatePositiveRight(
                node,
                element,
                this.matchSet,
              )
            break

          case 'MP':
          case 'UNHASHED_MP':
            if ((globalThis as any).__AZ_B0_20533__) console.log('20533-AC', { timetag: element.timetag, nodeId: node.nodeId, type: node.type })
            this.reteActivationEngine
              .activateMpRight(
                node,
                element,
                this.matchSet,
              )
            break

          case 'NEGATIVE':
          case 'UNHASHED_NEGATIVE':
            if ((globalThis as any).__AZ_B0_20533__) console.log('20533-AE', { timetag: element.timetag, nodeId: node.nodeId, type: node.type })
            this.reteActivationEngine
              .activateNegativeRight(
                node,
                element,
                this.matchSet,
              )
            break
        }
      }
    }
  }

  public removeWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): void {
    const affectedAlphaMemories =
      this.alphaMemoryManager
        .removeWorkingMemoryElement(
          element,
        )

    this.reteActivationEngine
      .removeWorkingMemoryElement(
        element,
        affectedAlphaMemories,
        this.matchSet,
      )
  }
}
