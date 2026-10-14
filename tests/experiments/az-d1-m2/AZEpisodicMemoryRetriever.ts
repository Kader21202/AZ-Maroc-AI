import type {
  AZEpisodicMemoryRecord,
} from './AZEpisodicMemoryRecord'
import type {
  AZEpisodicMemoryStore,
} from './AZEpisodicMemoryStore'

export class AZEpisodicMemoryRetriever {
  public retrieve(
    store: AZEpisodicMemoryStore,
    context: string,
  ): readonly AZEpisodicMemoryRecord[] {
    return store.getAll().filter(
      episode => episode.context === context,
    )
  }
}
