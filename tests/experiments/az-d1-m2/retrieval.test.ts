import assert from 'node:assert/strict'
import { AZEpisodicMemoryStore } from './AZEpisodicMemoryStore'
import { AZEpisodicMemoryRetriever } from './AZEpisodicMemoryRetriever'
import type { AZEpisodicMemoryRecord } from './AZEpisodicMemoryRecord'

const episode = (
  id: string,
  context: string,
  action: string,
  outcome: string,
): AZEpisodicMemoryRecord => ({
  id,
  timestamp: '2026-10-13T20:00:00.000Z',
  context,
  action,
  outcome,
  memory: {
    root: id,
    elements: [],
  },
})

const store = new AZEpisodicMemoryStore()

store.add(episode('E1', 'obstacle', 'contourner', 'succes'))
store.add(episode('E2', 'obstacle', 'avancer', 'echec'))
store.add(episode('E3', 'terrain-libre', 'avancer', 'succes'))

const retriever = new AZEpisodicMemoryRetriever()

const relevant = retriever.retrieve(store, 'obstacle')

assert.deepEqual(
  relevant.map(record => record.id),
  ['E1', 'E2'],
)

assert.deepEqual(
  retriever.retrieve(store, 'terrain-libre')
    .map(record => record.id),
  ['E3'],
)

assert.deepEqual(
  retriever.retrieve(store, 'situation-inconnue'),
  [],
)

console.log('AZ-D1-M2 SELECTIVE RECALL: PASS')
