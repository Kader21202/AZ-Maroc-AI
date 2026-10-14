import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import { DefaultAZMultiStepProductionFactory } from '../../src/engines/cognitive/az/kernel/DefaultAZMultiStepProductionFactory'

const runtime =
  new AZCognitiveRuntimeAssembly()

const rootGoal =
  runtime.symbolManager.makeIdentifier('S')

runtime.decisionRuntime
  .goalContextInitializer
  .initialize(
    rootGoal,
    1,
  )

runtime.contextStack.setTop(rootGoal)

runtime.stateStack.setTop(
  {},
  rootGoal,
)

const inputWmeRegistry =
  new AZInputWmeRegistry()

const inputWmeManager =
  new AZInputWmeManager(
    runtime.workingMemory,
    inputWmeRegistry,
  )

const ioInitializer =
  new AZIoStructureInitializer(
    runtime.symbolManager,
    runtime.predefinedSymbols,
    inputWmeManager,
    runtime.identifierStateRegistry,
  )

ioInitializer.initialize(
  rootGoal,
  runtime.ioState,
)

const inputLink =
  runtime.ioState.inputLink

const outputLink =
  runtime.ioState.outputLink

assert.notEqual(inputLink, null)
assert.notEqual(outputLink, null)

if (
  inputLink === null ||
  outputLink === null
) {
  throw new Error(
    'AZ IO structure was not initialized',
  )
}

const questionAttribute =
  runtime.symbolManager.makeStringConstant(
    'question',
  )

const questionValue =
  runtime.symbolManager.makeStringConstant(
    'Quel est le statut de la plateforme ?',
  )

inputWmeManager.add(
  inputLink,
  questionAttribute,
  questionValue,
)

const factory =
  new DefaultAZMultiStepProductionFactory({
    symbols: runtime.symbolManager,
    predefinedSymbols:
      runtime.predefinedSymbols,
  })

for (
  const production of
  factory.createProposalProductions()
) {
  runtime.productionRuntime
    .productionInstaller
    .install(
      runtime.productionRuntime
        .productionMaterializer
        .materialize(production),
    )
}

for (
  const production of
  factory.createApplicationProductions(
    outputLink,
  )
) {
  runtime.productionRuntime
    .productionInstaller
    .install(
      runtime.productionRuntime
        .productionMaterializer
        .materialize(production),
    )
}

let result: string | null = null

for (
  let step = 0;
  step < 25 && result === null;
  step += 1
) {
  runtime.phaseRuntime
    .phaseExecutor
    .executeOnePhase()

  const resultWme =
    runtime.workingMemory
      .getElements()
      .find(
        (wme) =>
          wme.identifier === outputLink &&
          wme.attribute.type ===
            'STRING_CONSTANT' &&
          wme.attribute.value ===
            'result',
      )

  if (
    resultWme !== undefined &&
    typeof resultWme.value.value ===
      'string'
  ) {
    result =
      resultWme.value.value
  }
}

assert.equal(
  result,
  'AZ-Maroc-AI completed the cognitive application cycle.',
)

console.log(
  'AZ independent question-to-result: OK',
)










