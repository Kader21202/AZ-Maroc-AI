import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZGoalContext } from './AZGoalContext'

export class AZGoalContextStack {
  private topContext:
    AZGoalContext | null = null

  private bottomContext:
    AZGoalContext | null = null

  public get top(): AZGoalContext | null {
    return this.topContext
  }

  public get bottom(): AZGoalContext | null {
    return this.bottomContext
  }

  public setTop(
    goal: AZSymbol,
  ): AZGoalContext {
    if (this.topContext !== null) {
      throw new Error(
        'Top goal context already exists',
      )
    }

    const context: AZGoalContext = {
      goal,
      higher: null,
      lower: null,
    }

    this.topContext = context
    this.bottomContext = context

    return context
  }

  public appendLower(
    parent: AZGoalContext,
    goal: AZSymbol,
  ): AZGoalContext {
    if (!this.contains(parent)) {
      throw new Error(
        'Parent goal context does not belong to this stack',
      )
    }

    if (parent.lower !== null) {
      throw new Error(
        'Parent goal context already has a lower context',
      )
    }

    const context: AZGoalContext = {
      goal,
      higher: parent,
      lower: null,
    }

    parent.lower = context
    this.bottomContext = context

    return context
  }

  public findByGoal(
    goal: AZSymbol,
  ): AZGoalContext | null {
    let current = this.topContext

    while (current !== null) {
      if (current.goal === goal) {
        return current
      }

      current = current.lower
    }

    return null
  }

  public truncateFrom(
    goal: AZSymbol,
  ): boolean {
    const context =
      this.findByGoal(goal)

    if (context === null) {
      return false
    }

    const higher =
      context.higher

    if (higher === null) {
      this.topContext = null
      this.bottomContext = null
      return true
    }

    higher.lower = null
    this.bottomContext = higher

    return true
  }

  private contains(
    target: AZGoalContext,
  ): boolean {
    let current = this.topContext

    while (current !== null) {
      if (current === target) {
        return true
      }

      current = current.lower
    }

    return false
  }
}
