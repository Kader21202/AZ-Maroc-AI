import type { AZCognitiveRunControl } from '../cycle/AZCognitiveRunControl'
import type { AZRhsFunction } from './AZRhsFunction'

export class AZHaltRhsFunction
  implements AZRhsFunction
{
  public readonly numArgsExpected = 0

  public readonly canBeRhsValue = false

  public readonly canBeStandaloneAction = true

  public constructor(
    private readonly runControl:
      AZCognitiveRunControl,
  ) {}

  public execute(): null {
    this.runControl.halt('halt')

    return null
  }

}
