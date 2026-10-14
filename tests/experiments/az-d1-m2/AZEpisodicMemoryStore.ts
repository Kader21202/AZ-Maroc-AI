import type {
  AZEpisodicMemoryRecord,
} from './AZEpisodicMemoryRecord'

export class AZEpisodicMemoryStore {
  private readonly episodes =
    new Map<string, AZEpisodicMemoryRecord>()

  public add(
    episode: AZEpisodicMemoryRecord,
  ): boolean {
    if (this.episodes.has(episode.id)) {
      return false
    }

    this.episodes.set(episode.id, episode)
    return true
  }

  public findById(
    id: string,
  ): AZEpisodicMemoryRecord | undefined {
    return this.episodes.get(id)
  }

  public getAll():
    readonly AZEpisodicMemoryRecord[] {
    return [...this.episodes.values()]
  }

  public clear(): void {
    this.episodes.clear()
  }
}
