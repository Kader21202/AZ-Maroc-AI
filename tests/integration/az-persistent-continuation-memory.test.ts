import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import type { PersistentContinuationMemory } from '../../src/engines/cognitive/az/monitoring/PersistentContinuationMemory'
import { PersistentContinuationMemoryExtractor } from '../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryExtractor'
import { PersistentContinuationMemoryInjector } from '../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryInjector'

const initializeRuntime = (
  onNormalInputCycle?: () => void,
) => {
  const runtime =
    new AZCognitiveRuntimeAssembly(
      onNormalInputCycle,
    )

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

  if (
    inputLink === null ||
    outputLink === null
  ) {
    throw new Error(
      'AZ IO structure was not initialized',
    )
  }

  return {
    runtime,
    rootGoal,
    inputLink,
    outputLink,
    inputWmeManager,
  }
}

const produceMemory = (
  payload: string,
): PersistentContinuationMemory => {
  const {
    runtime,
    rootGoal,
    inputLink,
    outputLink,
    inputWmeManager,
  } = initializeRuntime()

  const symbols =
    runtime.symbolManager

  const stateVariable =
    symbols.makeVariable('s')

  const ioHeaderVariable =
    symbols.makeVariable('io')

  const inputLinkVariable =
    symbols.makeVariable('il')

  const stimulusAttribute =
    symbols.makeStringConstant('stimulus')

  const stimulusValue =
    symbols.makeStringConstant('start')

  const memoryAttribute =
    symbols.makeStringConstant('memory')

  const payloadAttribute =
    symbols.makeStringConstant('payload')

  const payloadValue =
    symbols.makeStringConstant(payload)

  const operatorValue =
    symbols.makeIdentifier('O')

  inputWmeManager.add(
    inputLink,
    stimulusAttribute,
    stimulusValue,
  )

  const proposalProduction:
    AZProductionDescriptor = {
    name: 'persistent-memory-proposal',
    declaredSupport: 'I_SUPPORT',

    conditions: [
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: stateVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent:
            runtime.predefinedSymbols.io,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: ioHeaderVariable,
        },
        acceptable: false,
      },
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: ioHeaderVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent:
            runtime.predefinedSymbols.inputLink,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: inputLinkVariable,
        },
        acceptable: false,
      },
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: inputLinkVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent: stimulusAttribute,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: stimulusValue,
        },
        acceptable: false,
      },
    ],

    actions: [
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: stateVariable,
        },
        attribute: {
          type: 'SYMBOL',
          symbol:
            runtime.predefinedSymbols.operator,
        },
        value: {
          type: 'SYMBOL',
          symbol: operatorValue,
        },
        support: 'UNKNOWN',
      },
    ],
  }

  const applicationProduction:
    AZProductionDescriptor = {
    name: 'persistent-memory-application',
    declaredSupport: 'O_SUPPORT',

    conditions: [
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: stateVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent:
            runtime.predefinedSymbols.operator,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: operatorValue,
        },
        acceptable: false,
      },
    ],

    actions: [
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: outputLink,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: memoryAttribute,
        },
        value: {
          type: 'UNBOUND_VARIABLE',
          index: 0,
        },
        support: 'UNKNOWN',
      },
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'UNBOUND_VARIABLE',
          index: 0,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: payloadAttribute,
        },
        value: {
          type: 'SYMBOL',
          symbol: payloadValue,
        },
        support: 'UNKNOWN',
      },
    ],
  }

  for (
    const descriptor of [
      proposalProduction,
      applicationProduction,
    ]
  ) {
    const production =
      runtime.productionRuntime
        .productionMaterializer
        .materialize(descriptor)

    assert.equal(
      runtime.productionRuntime
        .productionInstaller
        .install(production),
      'NO_REFRACTED_INSTANTIATION',
    )
  }

  for (
    let step = 0;
    step < 30;
    step += 1
  ) {
    const phaseResult =
      runtime.phaseRuntime
        .phaseExecutor
        .executeOnePhase()

    if (
      phaseResult.executedPhase !==
      'OUTPUT'
    ) {
      continue
    }

    const commands =
      phaseResult.outputCommands ?? []

    const command =
      commands.find(
        candidate =>
          candidate.mode === 'ADDED',
      )

    if (command !== undefined) {
      const memory =
        new PersistentContinuationMemoryExtractor()
          .extract(
            command,
            runtime.workingMemory,
          )

      /*
       * Only the plain logical memory crosses
       * the runtime boundary.
       */
      return JSON.parse(
        JSON.stringify(memory),
      ) as PersistentContinuationMemory
    }
  }

  throw new Error(
    'Runtime A did not emit persistent memory',
  )
}

const resume = (
  memory: PersistentContinuationMemory,
): boolean => {
  let injected = false

  let inject = () => {}

  const {
    runtime,
    rootGoal,
    inputLink,
    outputLink,
    inputWmeManager,
  } = initializeRuntime(
    () => {
      if (injected) {
        return
      }

      inject()
      injected = true
    },
  )

  inject = () => {
    new PersistentContinuationMemoryInjector()
      .inject(
        memory,
        inputLink,
        runtime.symbolManager,
        runtime.identifierStateRegistry,
        inputWmeManager,
      )
  }

  const symbols =
    runtime.symbolManager

  const stateVariable =
    symbols.makeVariable('s')

  const ioHeaderVariable =
    symbols.makeVariable('io')

  const inputLinkVariable =
    symbols.makeVariable('il')

  const memoryVariable =
    symbols.makeVariable('m')

  const persistentMemoryAttribute =
    symbols.makeStringConstant(
      'persistent-memory',
    )

  const payloadAttribute =
    symbols.makeStringConstant('payload')

  const expectedPayload =
    symbols.makeStringConstant('alpha')

  const resumedAttribute =
    symbols.makeStringConstant('resumed')

  const resumedValue =
    symbols.makeStringConstant('yes')

  const production:
    AZProductionDescriptor = {
    name: 'persistent-memory-resume',
    declaredSupport: 'I_SUPPORT',

    conditions: [
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: stateVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent:
            runtime.predefinedSymbols.io,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: ioHeaderVariable,
        },
        acceptable: false,
      },
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: ioHeaderVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent:
            runtime.predefinedSymbols.inputLink,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: inputLinkVariable,
        },
        acceptable: false,
      },
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: inputLinkVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent:
            persistentMemoryAttribute,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: memoryVariable,
        },
        acceptable: false,
      },
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: memoryVariable,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent: payloadAttribute,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: expectedPayload,
        },
        acceptable: false,
      },
    ],

    actions: [
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: outputLink,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: resumedAttribute,
        },
        value: {
          type: 'SYMBOL',
          symbol: resumedValue,
        },
        support: 'UNKNOWN',
      },
    ],
  }

  const materialized =
    runtime.productionRuntime
      .productionMaterializer
      .materialize(production)

  assert.equal(
    runtime.productionRuntime
      .productionInstaller
      .install(materialized),
    'NO_REFRACTED_INSTANTIATION',
  )

  for (
    let step = 0;
    step < 20;
    step += 1
  ) {
    runtime.phaseRuntime
      .phaseExecutor
      .executeOnePhase()

    if (
      runtime.workingMemory
        .getElements()
        .some(
          wme =>
            wme.identifier ===
              outputLink &&
            wme.attribute.type ===
              'STRING_CONSTANT' &&
            wme.attribute.value ===
              'resumed' &&
            wme.value.type ===
              'STRING_CONSTANT' &&
            wme.value.value === 'yes',
        )
    ) {
      assert.equal(
        injected,
        true,
        'M must enter B through NORMAL_INPUT_CYCLE',
      )

      return true
    }
  }

  assert.equal(
    injected,
    true,
    'M must enter B through NORMAL_INPUT_CYCLE',
  )

  return false
}

const alphaMemory =
  produceMemory('alpha')

assert.equal(
  resume(alphaMemory),
  true,
  'alpha memory must causally trigger resumed behavior',
)

const betaMemory =
  produceMemory('beta')

assert.equal(
  resume(betaMemory),
  false,
  'different persistent content must not trigger alpha behavior',
)

assert.notDeepEqual(
  alphaMemory,
  betaMemory,
  'logical persistent memories must differ when causal payload differs',
)

console.log(
  'AZ persistent continuation memory: OK',
)
