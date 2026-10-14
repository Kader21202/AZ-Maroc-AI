import { AZInputWmeManager } from '../../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import assert from 'node:assert/strict'
import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import type { AZProductionDescriptor } from '../../../src/engines/cognitive/az/core/production/AZProductionDescriptor'

const runtime = new AZCognitiveRuntimeAssembly()
const symbols = runtime.symbolManager

const rootGoal = symbols.makeIdentifier('S')
runtime.decisionRuntime.goalContextInitializer.initialize(rootGoal, 1)
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
const state = symbols.makeVariable('s')
const operator = symbols.makeIdentifier('O')

const eq = (referent: any) => ({
  type: 'EQUALITY' as const,
  referent,
})

const production: AZProductionDescriptor = {
  name: 'az-d1-m2-baseline-proposal',
  declaredSupport: 'I_SUPPORT',
  conditions: [{
    type: 'POSITIVE',
    identifierTest: eq(state),
    attributeTest: eq(runtime.predefinedSymbols.io),
    valueTest: eq(runtime.ioState.ioHeader),
    acceptable: false,
  }],
  actions: [{
    type: 'MAKE',
    preferenceType: 'ACCEPTABLE',
    identifier: { type: 'SYMBOL', symbol: state },
    attribute: {
      type: 'SYMBOL',
      symbol: runtime.predefinedSymbols.operator,
    },
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

assert.equal(selected, true, 'AZ must select the proposed operator')

console.log('AZ-D1-M2 COGNITIVE DECISION BASELINE: PASS')


