import { readFileSync, writeFileSync } from 'node:fs'
import { AZEpisodicMemoryStore } from './AZEpisodicMemoryStore'
import type { AZEpisodicMemoryRecord } from './AZEpisodicMemoryRecord'

export class AZEpisodicMemoryPersistence {
  public save(
    file: string,
    store: AZEpisodicMemoryStore,
  ): void {
    const episodes = store.getAll()

    writeFileSync(
      file,
      JSON.stringify(episodes, null, 2),
      'utf8',
    )
  }

  public load(
    file: string,
  ): AZEpisodicMemoryStore {
    const contents = readFileSync(file, 'utf8')
    const episodes: unknown = JSON.parse(contents)

    if (!Array.isArray(episodes)) {
      throw new Error(
        'Invalid episodic memory file: expected an array',
      )
    }

    const store = new AZEpisodicMemoryStore()

    for (const episode of episodes) {
      if (
        typeof episode !== 'object' ||
        episode === null ||
        typeof episode.id !== 'string' ||
        typeof episode.timestamp !== 'string' ||
        typeof episode.context !== 'string' ||
        typeof episode.action !== 'string' ||
        typeof episode.outcome !== 'string' ||
        typeof episode.memory !== 'object' ||
        episode.memory === null
      ) {
        throw new Error('Invalid episodic memory record')
      }

      if (!store.add(episode as AZEpisodicMemoryRecord)) {
        throw new Error(
          `Duplicate episodic memory ID: ${episode.id}`,
        )
      }
    }

    return store
  }
}
