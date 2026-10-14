import type { AZSymbol } from '../symbols/AZSymbol'

export interface AZStateStackEntry {
  readonly state: object
  readonly goal: AZSymbol
  higher: AZStateStackEntry | null
  lower: AZStateStackEntry | null
}

export class AZStateStack {
  private topEntry:
    AZStateStackEntry | null = null

  private bottomEntry:
    AZStateStackEntry | null = null

  public get top():
    AZStateStackEntry | null {
    return this.topEntry
  }

  public get bottom():
    AZStateStackEntry | null {
    return this.bottomEntry
  }

  public setTop(
    state: object,
    goal: AZSymbol,
  ): AZStateStackEntry {
    const entry: AZStateStackEntry = {
      state,
      goal,
      higher: null,
      lower: null,
    }

    this.topEntry = entry
    this.bottomEntry = entry

    return entry
  }

  public appendLower(
    parent: AZStateStackEntry,
    state: object,
    goal: AZSymbol,
  ): AZStateStackEntry {
    const entry: AZStateStackEntry = {
      state,
      goal,
      higher: parent,
      lower: null,
    }

    parent.lower = entry
    this.bottomEntry = entry

    return entry
  }

  public truncateFrom(
    goal: AZSymbol,
  ): boolean {
    const entry =
      this.findByGoal(goal)

    if (entry === null) {
      return false
    }

    const higher =
      entry.higher

    if (higher === null) {
      this.topEntry = null
      this.bottomEntry = null
      return true
    }

    higher.lower = null
    this.bottomEntry = higher

    return true
  }

  public findByGoal(
    goal: AZSymbol,
  ): AZStateStackEntry | null {
    let current =
      this.topEntry

    while (current !== null) {
      if (current.goal === goal) {
        return current
      }

      current = current.lower
    }

    return null
  }
}
