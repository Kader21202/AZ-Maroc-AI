import type { AZWorkingMemoryReteMatcher } from '../production/AZWorkingMemoryReteMatcher'
import type { AZWorkingMemoryElement } from './AZWorkingMemoryElement'
import type { AZWorkingMemoryPropagation } from './AZWorkingMemoryPropagation'

export class AZDefaultWorkingMemoryPropagation
  implements AZWorkingMemoryPropagation
{
  public constructor(
    private readonly matcher:
      AZWorkingMemoryReteMatcher,
  ) {}

  public onAdded(
    element: AZWorkingMemoryElement,
  ): void {
    this.matcher.addWorkingMemoryElement(
      element,
    )
  }

  public onRemoved(
    element: AZWorkingMemoryElement,
  ): void {
    this.matcher.removeWorkingMemoryElement(
      element,
    )
  }
}
