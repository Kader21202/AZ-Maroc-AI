export class ControlledRandomSequence {
  private index = 0

  public constructor(
    private readonly sequence:
      readonly number[],
  ) {
    for (const value of sequence) {
      if (
        !Number.isFinite(value) ||
        value < 0 ||
        value >= 1
      ) {
        throw new Error(
          'Controlled random values must be finite and in [0, 1)',
        )
      }
    }
  }

  public next(): number {
    if (this.index >= this.sequence.length) {
      throw new Error(
        'Controlled random sequence exhausted',
      )
    }

    const value =
      this.sequence[this.index]

    this.index += 1

    if (value === undefined) {
      throw new Error(
        'Controlled random sequence exhausted',
      )
    }

    return value
  }

  public currentIndex(): number {
    return this.index
  }
}
