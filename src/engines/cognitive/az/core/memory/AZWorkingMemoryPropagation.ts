import type { AZWorkingMemoryElement } from './AZWorkingMemoryElement'

export interface AZWorkingMemoryPropagation {
  onAdded(
    element: AZWorkingMemoryElement,
  ): void

  onRemoved(
    element: AZWorkingMemoryElement,
  ): void
}
