import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import { PersistentContinuationMemoryInjector } from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryInjector'
import { AZEpisodicMemoryStore } from '../az-d1-m2/AZEpisodicMemoryStore'
import { AZEpisodicMemoryRetriever } from '../az-d1-m2/AZEpisodicMemoryRetriever'

const episodes = [
  { id: 'E1', action: 'contourner', outcome: 'succes' },
  { id: 'E2', action: 'avancer', outcome: 'succes' },
  { id: 'E3', action: 'contourner', outcome: 'echec' },
] as const

const store = new AZEpisodicMemoryStore()

for (const episode of episodes) {
  assert.equal(store.add({
    ...episode,
    timestamp: '2026-10-13T20:00:00.000Z',
    context: 'obstacle',
    memory: {
      root: 'm0',
      elements: [
        {
          identifier: 'm0',
          attribute: { type: 'STRING_CONSTANT', value: 'episode-id' },
          value: { type: 'STRING_CONSTANT', value: episode.id },
          acceptable: false,
        },
        {
          identifier: 'm0',
          attribute: { type: 'STRING_CONSTANT', value: 'action' },
          value: { type: 'STRING_CONSTANT', value: episode.action },
          acceptable: false,
        },
        {
          identifier: 'm0',
          attribute: { type: 'STRING_CONSTANT', value: 'outcome' },
          value: { type: 'STRING_CONSTANT', value: episode.outcome },
          acceptable: false,
        },
      ],
    },
  }), true)
}

const recalled =
  new AZEpisodicMemoryRetriever().retrieve(store, 'obstacle')

assert.equal(recalled.length, 3)
assert.deepEqual(recalled.map(e => e.id), ['E1', 'E2', 'E3'])
assert.equal(
  new AZEpisodicMemoryRetriever().retrieve(store, 'terrain-libre').length,
  0,
)

const runtime = new AZCognitiveRuntimeAssembly()
const symbols = runtime.symbolManager
const rootGoal = symbols.makeIdentifier('S')

runtime.decisionRuntime.goalContextInitializer.initialize(rootGoal, 1)
runtime.contextStack.setTop(rootGoal)
runtime.stateStack.setTop({}, rootGoal)

const inputManager = new AZInputWmeManager(
  runtime.workingMemory,
  new AZInputWmeRegistry(),
)

new AZIoStructureInitializer(
  symbols,
  runtime.predefinedSymbols,
  inputManager,
  runtime.identifierStateRegistry,
).initialize(rootGoal, runtime.ioState)

const inputLink = runtime.ioState.inputLink
assert.notEqual(inputLink, null)
if (inputLink === null) throw new Error('Missing input-link')

const injector = new PersistentContinuationMemoryInjector()
const roots = recalled.map(episode =>
  injector.inject(
    episode.memory,
    inputLink,
    symbols,
    runtime.identifierStateRegistry,
    inputManager,
  ),
)

assert.equal(new Set(roots).size, 3)

runtime.workingMemory.applyBufferedChanges()

const wmes = runtime.workingMemory.getElements()
const persistentMemoryAttribute =
  symbols.makeStringConstant('persistent-memory')

const attachments = wmes.filter(wme =>
  wme.identifier === inputLink &&
  wme.attribute === persistentMemoryAttribute &&
  wme.acceptable === false
)

assert.equal(attachments.length, 3)
assert.deepEqual(
  new Set(attachments.map(wme => wme.value)),
  new Set(roots),
)

for (let index = 0; index < recalled.length; index++) {
  const root = roots[index]
  const episode = recalled[index]

  for (const [attribute, value] of [
    ['episode-id', episode.id],
    ['action', episode.action],
    ['outcome', episode.outcome],
  ]) {
    assert.equal(
      wmes.filter(wme =>
        wme.identifier === root &&
        wme.attribute === symbols.makeStringConstant(attribute) &&
        wme.value === symbols.makeStringConstant(value) &&
        wme.acceptable === false
      ).length,
      1,
      `${episode.id}: ${attribute} must be preserved`,
    )
  }
}

console.log('AZ-D1-M3.1 MULTIPLE EPISODES: PASS')

