import assert from 'node:assert/strict'
import { AZEpisodicMemoryStore } from './AZEpisodicMemoryStore'
import type { AZEpisodicMemoryRecord } from './AZEpisodicMemoryRecord'

const createEpisode = (
  id: string,
  action: string,
): AZEpisodicMemoryRecord => ({
  id,
  timestamp: '2026-10-13T20:00:00.000Z',
  context: 'obstacle',
  action,
  outcome: action === 'contourner' ? 'succes' : 'echec',
  memory: {
    root: 'M1',
    elements: [],
  },
})

const store = new AZEpisodicMemoryStore()

const first = createEpisode('episode-1', 'contourner')
const second = createEpisode('episode-2', 'avancer')

store.add(first)
store.add(second)

assert.equal(store.getAll().length, 2)
assert.deepEqual(store.findById('episode-1'), first)
assert.deepEqual(store.findById('episode-2'), second)
assert.equal(store.findById('inconnu'), undefined)

console.log('AZ-D1-M2 EPISODIC STORE: PASS')
