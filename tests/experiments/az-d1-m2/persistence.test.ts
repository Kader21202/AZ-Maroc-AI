import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AZEpisodicMemoryPersistence } from './AZEpisodicMemoryPersistence'
import { AZEpisodicMemoryStore } from './AZEpisodicMemoryStore'
import type { AZEpisodicMemoryRecord } from './AZEpisodicMemoryRecord'

const directory = mkdtempSync(join(tmpdir(), 'az-m2-'))
const file = join(directory, 'episodes.json')

const episode = (
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

try {
  const original = new AZEpisodicMemoryStore()
  original.add(episode('E1', 'contourner'))
  original.add(episode('E2', 'avancer'))

  const persistence = new AZEpisodicMemoryPersistence()
  persistence.save(file, original)

  const restored = persistence.load(file)

  assert.equal(restored.getAll().length, 2)
  assert.deepEqual(restored.findById('E1'), original.findById('E1'))
  assert.deepEqual(restored.findById('E2'), original.findById('E2'))

  console.log('AZ-D1-M2 PERSISTENCE: PASS')
} finally {
  rmSync(directory, { recursive: true, force: true })
}
