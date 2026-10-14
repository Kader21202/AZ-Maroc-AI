export interface AZTransitiveClosureNumberGenerator {
  next(): number
}

export class AZDefaultTransitiveClosureNumberGenerator
  implements AZTransitiveClosureNumberGenerator
{
  private current = 0

  public next(): number {
    this.current += 1

    if (this.current === 0) {
      this.current = 1
    }

    return this.current
  }
}
