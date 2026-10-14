import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'

import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import { PersistentContinuationMemoryExtractor } from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryExtractor'

const payload = process.argv[2]
const destination = process.argv[3]

if (
  (payload !== 'alpha' && payload !== 'beta') ||
  !destination
) {
  throw new Error('Usage: producer alpha|beta destination.json')
}

const runtime = new AZCognitiveRuntimeAssembly()

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

const symbols = runtime.symbolManager

const state = symbols.makeVariable('s')
const io = symbols.makeVariable('io')
const il = symbols.makeVariable('il')

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

const operator = symbols.makeIdentifier('O')

inputWmeManager.add(
  inputLink,
  symbols.makeStringConstant('stimulus'),
  symbols.makeStringConstant('start'),
)

const proposal: AZProductionDescriptor = {
  name: 'az-d1-m1-proposal',
  declaredSupport: 'I_SUPPORT',
  conditions: [
    condition(state, runtime.predefinedSymbols.io, io),
    condition(io, runtime.predefinedSymbols.inputLink, il),
    condition(
      il,
      symbols.makeStringConstant('stimulus'),
      symbols.makeStringConstant('start'),
    ),
  ],
  actions: [{
    type: 'MAKE',
    preferenceType: 'ACCEPTABLE',
    identifier: symbol(state),
    attribute: symbol(runtime.predefinedSymbols.operator),
    value: symbol(operator),
    support: 'UNKNOWN',
  }],
}

const application: AZProductionDescriptor = {
  name: 'az-d1-m1-application',
  declaredSupport: 'O_SUPPORT',
  conditions: [
    condition(
      state,
      runtime.predefinedSymbols.operator,
      operator,
    ),
  ],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: symbol(outputLink),
      attribute: symbol(symbols.makeStringConstant('memory')),
      value: { type: 'UNBOUND_VARIABLE', index: 0 },
      support: 'UNKNOWN',
    },
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'UNBOUND_VARIABLE',
        index: 0,
      },
      attribute: symbol(symbols.makeStringConstant('payload')),
      value: symbol(symbols.makeStringConstant(payload)),
      support: 'UNKNOWN',
    },
  ],
}

for (const descriptor of [proposal, application]) {
  const production =
    runtime.productionRuntime.productionMaterializer
      .materialize(descriptor)

  assert.equal(
    runtime.productionRuntime.productionInstaller.install(production),
    'NO_REFRACTED_INSTANTIATION',
  )
}

for (let step = 0; step < 30; step++) {
  const result =
    runtime.phaseRuntime.phaseExecutor.executeOnePhase()

  if (result.executedPhase !== 'OUTPUT') {
    continue
  }

  const command = (result.outputCommands ?? [])
    .find(candidate => candidate.mode === 'ADDED')

  if (!command) {
    continue
  }

  const memory =
    new PersistentContinuationMemoryExtractor()
      .extract(command, runtime.workingMemory)

  writeFileSync(
    destination,
    JSON.stringify(memory, null, 2),
    'utf8',
  )

  console.log(`AZ-D1-M1 PRODUCER OK: ${payload}`)
  process.exit(0)
}

throw new Error('AZ did not produce persistent memory')
