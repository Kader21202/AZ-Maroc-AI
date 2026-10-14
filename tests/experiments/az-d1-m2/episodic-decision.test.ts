import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import { PersistentContinuationMemoryInjector } from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryInjector'

import { AZEpisodicMemoryStore } from './AZEpisodicMemoryStore'
import { AZEpisodicMemoryRetriever } from './AZEpisodicMemoryRetriever'

const store = new AZEpisodicMemoryStore()

assert.equal(store.add({
  id: 'E1',
  timestamp: '2026-10-13T20:00:00.000Z',
  context: 'obstacle',
  action: 'contourner',
  outcome: 'succes',
  memory: {
    root: 'm0',
    elements: [
      {
        identifier: 'm0',
        attribute: { type: 'STRING_CONSTANT', value: 'action' },
        value: { type: 'STRING_CONSTANT', value: 'contourner' },
        acceptable: false,
      },
      {
        identifier: 'm0',
        attribute: { type: 'STRING_CONSTANT', value: 'outcome' },
        value: { type: 'STRING_CONSTANT', value: 'succes' },
        acceptable: false,
      },
    ],
  },
}), true)

const recalled = new AZEpisodicMemoryRetriever()
  .retrieve(store, 'obstacle')

assert.equal(recalled.length, 1)

let injected = false
let inject = () => {}

const runtime = new AZCognitiveRuntimeAssembly(() => {
  if (!injected) {
    inject()
    injected = true
  }
})

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
if (!inputLink) throw new Error('Missing input-link')

inject = () => {
  new PersistentContinuationMemoryInjector().inject(
    recalled[0].memory,
    inputLink,
    symbols,
    runtime.identifierStateRegistry,
    inputManager,
  )
}

const state = symbols.makeVariable('s')
const io = symbols.makeVariable('io')
const il = symbols.makeVariable('il')
const memory = symbols.makeVariable('memory')
const operator = symbols.makeIdentifier('O')

const eq = (referent: any) => ({
  type: 'EQUALITY' as const,
  referent,
})

const condition = (identifier: any, attribute: any, value: any) => ({
  type: 'POSITIVE' as const,
  identifierTest: eq(identifier),
  attributeTest: eq(attribute),
  valueTest: eq(value),
  acceptable: false,
})

const production: AZProductionDescriptor = {
  name: 'az-d1-m2-episodic-proposal',
  declaredSupport: 'I_SUPPORT',
  conditions: [
    condition(state, runtime.predefinedSymbols.io, io),
    condition(io, runtime.predefinedSymbols.inputLink, il),
    condition(il, symbols.makeStringConstant('persistent-memory'), memory),
    condition(memory, symbols.makeStringConstant('action'), symbols.makeStringConstant('contourner')),
    condition(memory, symbols.makeStringConstant('outcome'), symbols.makeStringConstant('succes')),
  ],
  actions: [{
    type: 'MAKE',
    preferenceType: 'ACCEPTABLE',
    identifier: { type: 'SYMBOL', symbol: state },
    attribute: { type: 'SYMBOL', symbol: runtime.predefinedSymbols.operator },
    value: { type: 'SYMBOL', symbol: operator },
    support: 'UNKNOWN',
  }],
}

const materialized =
  runtime.productionRuntime.productionMaterializer.materialize(production)

assert.equal(
  runtime.productionRuntime.productionInstaller.install(materialized),
  'NO_REFRACTED_INSTANTIATION',
)

let selected = false

for (let step = 0; step < 30; step++) {
  runtime.phaseRuntime.phaseExecutor.executeOnePhase()

  selected = runtime.workingMemory.getElements().some(wme =>
    wme.identifier === rootGoal &&
    wme.attribute === runtime.predefinedSymbols.operator &&
    wme.value === operator
  )

  if (selected) break
}

assert.equal(injected, true, 'Episode must enter through the AZ input cycle')
assert.equal(selected, true, 'Recalled episode must trigger AZ operator selection')

console.log('AZ-D1-M2 EPISODIC DECISION INTEGRATION: PASS')
