import type { AZProduction } from './AZProduction'

export class AZProceduralMemory {
  private readonly productions =
    new Map<string, AZProduction>()

  public add(
    production: AZProduction,
  ): boolean {
    if (
      this.productions.has(
        production.name,
      )
    ) {
      return false
    }

    this.productions.set(
      production.name,
      production,
    )

    return true
  }

  public remove(
    production: AZProduction,
  ): boolean {
    const registered =
      this.productions.get(
        production.name,
      )

    if (
      registered !== production
    ) {
      return false
    }

    return this.productions.delete(
      production.name,
    )
  }

  public findByName(
    name: string,
  ): AZProduction | undefined {
    return this.productions.get(name)
  }

  public getAll():
    readonly AZProduction[] {
    return [
      ...this.productions.values(),
    ]
  }

  public clear(): void {
    this.productions.clear()
  }
}
