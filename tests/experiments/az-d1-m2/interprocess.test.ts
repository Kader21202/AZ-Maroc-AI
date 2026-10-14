import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AZEpisodicMemoryPersistence } from './AZEpisodicMemoryPersistence'
import { AZEpisodicMemoryStore } from './AZEpisodicMemoryStore'

const directory = mkdtempSync(join(tmpdir(), 'az-m2-process-'))
const file = join(directory, 'episodes.json')
const mode = process.argv[2]

try {
  if (mode === 'producer') {
    const store = new AZEpisodicMemoryStore()

    store.add({
      id: 'E1',
      timestamp: '2026-10-13T20:00:00.000Z',
      context: 'obstacle',
      action: 'contourner',
      outcome: 'succes',
      memory: { root: 'M1', elements: [] },
    })

    store.add({
      id: 'E2',
      timestamp: '2026-10-13T20:01:00.000Z',
      context: 'obstacle',
      action: 'avancer',
      outcome: 'echec',
      memory: { root: 'M2', elements: [] },
    })

    new AZEpisodicMemoryPersistence().save(
      process.argv[3],
      store,
    )
    console.log('AZ-D1-M2 PRODUCER: PASS')
  } else if (mode === 'consumer') {
    const store = new AZEpisodicMemoryPersistence().load(
      process.argv[3],
    )

    assert.equal(store.getAll().length, 2)
    assert.equal(store.findById('E1')?.action, 'contourner')
    assert.equal(store.findById('E1')?.outcome, 'succes')
    assert.equal(store.findById('E2')?.action, 'avancer')
    assert.equal(store.findById('E2')?.outcome, 'echec')
    assert.notEqual(
      store.findById('E1')?.memory.root,
      store.findById('E2')?.memory.root,
    )

    console.log('AZ-D1-M2 CONSUMER: PASS')
  } else {
    for (const stage of ['producer', 'consumer']) {
      const result = spawnSync(
        process.execPath,
        [...process.execArgv, __filename, stage, file],
        { encoding: 'utf8', shell: false },
      )

      if (result.stdout) process.stdout.write(result.stdout)
      if (result.stderr) process.stderr.write(result.stderr)

      assert.equal(result.status, 0, `${stage} failed`)
    }

    console.log('AZ-D1-M2 INTERPROCESS: PASS')
  }
} finally {
  if (!mode) {
    rmSync(directory, { recursive: true, force: true })
  }
}


