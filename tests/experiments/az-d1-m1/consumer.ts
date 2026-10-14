import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import type { PersistentContinuationMemory } from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemory'
import { PersistentContinuationMemoryInjector } from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryInjector'

const source = process.argv[2]
const expected = process.argv[3]

if (!source || (expected !== 'yes' && expected !== 'no')) {
  throw new Error('Usage: consumer memory.json yes|no')
}

const memory = JSON.parse(
  readFileSync(source, 'utf8'),
) as PersistentContinuationMemory

let injected = false
let inject = () => {}

const runtime = new AZCognitiveRuntimeAssembly(() => {
  if (!injected) {
    inject()
    injected = true
  }
})

const rootGoal = runtime.symbolManager.makeIdentifier('S')

runtime.decisionRuntime.goalContextInitializer.initialize(
  rootGoal,
  1,
)

runtime.contextStack.setTop(rootGoal)
runtime.stateStack.setTop({}, rootGoal)

const inputWmeManager = new AZInputWmeManager(
  runtime.workingMemory,
  new AZInputWmeRegistry(),
)

new AZIoStructureInitializer(
  runtime.symbolManager,
  runtime.predefinedSymbols,
  inputWmeManager,
  runtime.identifierStateRegistry,
).initialize(rootGoal, runtime.ioState)

const inputLink = runtime.ioState.inputLink
const outputLink = runtime.ioState.outputLink

if (!inputLink || !outputLink) {
  throw new Error('AZ IO initialization failed')
}

inject = () => {
  new PersistentContinuationMemoryInjector().inject(
    memory,
    inputLink,
    runtime.symbolManager,
    runtime.identifierStateRegistry,
    inputWmeManager,
  )
}

const symbols = runtime.symbolManager
const state = symbols.makeVariable('s')
const io = symbols.makeVariable('io')
const il = symbols.makeVariable('il')
const m = symbols.makeVariable('m')

const eq = (referent: any) => ({
  type: 'EQUALITY' as const,
  referent,
})

const condition = (
  identifier: any,
  attribute: any,
  value: any,
) => ({
  type: 'POSITIVE' as const,
  identifierTest: eq(identifier),
  attributeTest: eq(attribute),
  valueTest: eq(value),
  acceptable: false,
})

const symbol = (value: any) => ({
  type: 'SYMBOL' as const,
  symbol: value,
})

const production: AZProductionDescriptor = {
  name: 'az-d1-m1-resume',
  declaredSupport: 'I_SUPPORT',
  conditions: [
    condition(state, runtime.predefinedSymbols.io, io),
    condition(io, runtime.predefinedSymbols.inputLink, il),
    condition(
      il,
      symbols.makeStringConstant('persistent-memory'),
      m,
    ),
    condition(
      m,
      symbols.makeStringConstant('payload'),
      symbols.makeStringConstant('alpha'),
    ),
  ],
  actions: [{
    type: 'MAKE',
    preferenceType: 'ACCEPTABLE',
    identifier: symbol(outputLink),
    attribute: symbol(symbols.makeStringConstant('resumed')),
    value: symbol(symbols.makeStringConstant('yes')),
    support: 'UNKNOWN',
  }],
}

const materialized =
  runtime.productionRuntime.productionMaterializer
    .materialize(production)

assert.equal(
  runtime.productionRuntime.productionInstaller.install(materialized),
  'NO_REFRACTED_INSTANTIATION',
)

let resumed = false

for (let step = 0; step < 20; step++) {
  runtime.phaseRuntime.phaseExecutor.executeOnePhase()

  resumed = runtime.workingMemory.getElements().some(wme =>
    wme.identifier === outputLink &&
    wme.attribute.type === 'STRING_CONSTANT' &&
    wme.attribute.value === 'resumed' &&
    wme.value.type === 'STRING_CONSTANT' &&
    wme.value.value === 'yes'
  )

  if (resumed) break
}

assert.equal(injected, true, 'Memory must enter via normal input cycle')
assert.equal(resumed, expected === 'yes')

console.log(
  `AZ-D1-M1 CONSUMER OK: expected=${expected}, resumed=${resumed}`
)
