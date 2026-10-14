import type { AZCognitiveRunControl } from './AZCognitiveRunControl'

export class AZDefaultCognitiveRunControl
  implements AZCognitiveRunControl
{
  private halted = false

  private stoppingReason:
    string | null = null

  public isHalted(): boolean {
    return this.halted
  }

  public halt(reason: string): void {
    this.halted = true
    this.stoppingReason = reason
  }

  public reasonForStopping():
    string | null {
    return this.stoppingReason
  }
}
