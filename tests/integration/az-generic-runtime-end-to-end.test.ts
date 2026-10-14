import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'

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

const stateVariable =
  runtime.symbolManager.makeVariable('s')

const ioHeaderVariable =
  runtime.symbolManager.makeVariable('io')

const inputLinkVariable =
  runtime.symbolManager.makeVariable('il')

const stimulusAttribute =
  runtime.symbolManager.makeStringConstant(
    'stimulus',
  )

const stimulusValue =
  runtime.symbolManager.makeStringConstant(
    'alpha-47',
  )

const responseAttribute =
  runtime.symbolManager.makeStringConstant(
    'response',
  )

const responseValue =
  runtime.symbolManager.makeStringConstant(
    'beta-83',
  )

const operatorValue =
  runtime.symbolManager.makeIdentifier('O')

inputWmeManager.add(
  inputLink,
  stimulusAttribute,
  stimulusValue,
)

const proposalProduction:
  AZProductionDescriptor = {
  name:
    'az-generic-runtime-operator-proposal',

  declaredSupport:
    'I_SUPPORT',

  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent:
          stateVariable,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent:
          runtime.predefinedSymbols.io,
      },
      valueTest: {
        type: 'EQUALITY',
        referent:
          ioHeaderVariable,
      },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent:
          ioHeaderVariable,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent:
          runtime.predefinedSymbols.inputLink,
      },
      valueTest: {
        type: 'EQUALITY',
        referent:
          inputLinkVariable,
      },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent:
          inputLinkVariable,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent:
          stimulusAttribute,
      },
      valueTest: {
        type: 'EQUALITY',
        referent:
          stimulusValue,
      },
      acceptable: false,
    },
  ],

  actions: [
    {
      type: 'MAKE',
      preferenceType:
        'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol:
          stateVariable,
      },
      attribute: {
        type: 'SYMBOL',
        symbol:
          runtime.predefinedSymbols.operator,
      },
      value: {
        type: 'SYMBOL',
        symbol:
          operatorValue,
      },
      support:
        'UNKNOWN',
    },
  ],
}

const applicationProduction:
  AZProductionDescriptor = {
  name:
    'az-generic-runtime-operator-application',

  declaredSupport:
    'O_SUPPORT',

  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent:
          stateVariable,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent:
          runtime.predefinedSymbols.operator,
      },
      valueTest: {
        type: 'EQUALITY',
        referent:
          operatorValue,
      },
      acceptable: false,
    },
  ],

  actions: [
    {
      type: 'MAKE',
      preferenceType:
        'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol:
          outputLink,
      },
      attribute: {
        type: 'SYMBOL',
        symbol:
          responseAttribute,
      },
      value: {
        type: 'SYMBOL',
        symbol:
          responseValue,
      },
      support:
        'UNKNOWN',
    },
    {
      type: 'FUNCALL',
      functionCall: {
        type: 'FUNCALL',
        functionName:
          runtime.symbolManager
            .makeStringConstant('halt'),
        arguments: [],
      },
    },
  ],
}


const materializedProposal =
  runtime.productionRuntime
    .productionMaterializer
    .materialize(proposalProduction)

assert.equal(
  runtime.productionRuntime
    .productionInstaller
    .install(materializedProposal),
  'NO_REFRACTED_INSTANTIATION',
)

const materializedApplication =
  runtime.productionRuntime
    .productionMaterializer
    .materialize(applicationProduction)

assert.equal(
  runtime.productionRuntime
    .productionInstaller
    .install(materializedApplication),
  'NO_REFRACTED_INSTANTIATION',
)

let result: string | null = null
let observedSelectedOperator = false
let observedOAssertion = false
let observedApplyPhase = false

for (
  let step = 0;
  step < 25 &&
  (
    result === null ||
    !runtime.runControl.isHalted()
  );
  step += 1
) {
  const phaseResult =
    runtime.phaseRuntime
      .phaseExecutor
      .executeOnePhase()

  if (
    runtime.workingMemory
      .getElements()
      .some(
        wme =>
          wme.identifier === rootGoal &&
          wme.attribute ===
            runtime.predefinedSymbols.operator &&
          wme.value === operatorValue &&
          wme.acceptable === false,
      )
  ) {
    observedSelectedOperator = true
  }

  if (
    runtime.productionRuntime
      .matchSet
      .hasAssertion(
        'O_ASSERTION',
        rootGoal,
      )
  ) {
    observedOAssertion = true
  }

  if (
    phaseResult.executedPhase === 'APPLY'
  ) {
    observedApplyPhase = true
  }

  const resultWme =
    runtime.workingMemory
      .getElements()
      .find(
        (wme) =>
          wme.identifier === outputLink &&
          wme.attribute.type ===
            'STRING_CONSTANT' &&
          wme.attribute.value ===
            'response',
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
  'beta-83',
)

assert.equal(
  observedSelectedOperator,
  true,
  'decision must install the proposed operator',
)

assert.equal(
  observedOAssertion,
  true,
  'selected operator must create an O-assertion',
)

assert.equal(
  observedApplyPhase,
  true,
  'execution must enter APPLY',
)

assert.equal(
  materializedProposal.instantiations.length > 0,
  true,
  'proposal production must fire',
)

assert.equal(
  materializedApplication.instantiations.length > 0,
  true,
  'APPLY must fire the operator-application production',
)

assert.equal(
  runtime.runControl.isHalted(),
  true,
)

assert.equal(
  runtime.runControl.reasonForStopping(),
  'halt',
)

console.log(
  'AZ generic runtime end-to-end: OK',
)



