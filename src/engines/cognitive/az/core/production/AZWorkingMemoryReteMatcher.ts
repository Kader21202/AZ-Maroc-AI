import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'

export interface AZWorkingMemoryReteMatcher {
  addWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): void

  removeWorkingMemoryElement(
    element: AZWorkingMemoryElement,
  ): void
}
