import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZAlphaMemory } from './AZAlphaMemory'

export interface AZAlphaMemoryManager {
  find(
    identifier: AZSymbol | null,
    attribute: AZSymbol | null,
    value: AZSymbol | null,
    acceptable: boolean,
  ): AZAlphaMemory | null

  findOrCreate(
    identifier: AZSymbol | null,
    attribute: AZSymbol | null,
    value: AZSymbol | null,
    acceptable: boolean,
  ): AZAlphaMemory

  removeReference(
    alphaMemory: AZAlphaMemory,
  ): void

  addWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): readonly AZAlphaMemory[]

  removeWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): readonly AZAlphaMemory[]

  getAlphaMemories():
    readonly AZAlphaMemory[]
}
