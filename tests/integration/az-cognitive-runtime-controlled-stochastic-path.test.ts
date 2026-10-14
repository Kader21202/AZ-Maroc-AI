import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { ControlledRandomSequence } from '../../src/engines/cognitive/az/monitoring/ControlledRandomSequence'
import { AZDefaultCandidateSelectionPolicy } from '../../src/engines/cognitive/az/core/decision/AZDefaultCandidateSelectionPolicy'
import { AZInputWmeManager } from '../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'

let randomCalls = 0

const candidateSelectionPolicy =
  new AZDefaultCandidateSelectionPolicy(
    () => {
      randomCalls += 1
      return 0.75
    },
  )

const runtime =
  new AZCognitiveRuntimeAssembly(
    undefined,
    undefined,
    candidateSelectionPolicy,
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

assert.notEqual(inputLink, null)

if (inputLink === null) {
  throw new Error(
    'AZ input link was not initialized',
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
    'controlled-rng',
  )

const operatorO1 =
  runtime.symbolManager.makeIdentifier('O')

const operatorO2 =
  runtime.symbolManager.makeIdentifier('O')

const numeric10 =
  runtime.symbolManager.makeIntegerConstant(10)

const numeric20 =
  runtime.symbolManager.makeIntegerConstant(20)

inputWmeManager.add(
  inputLink,
  stimulusAttribute,
  stimulusValue,
)

function makeProposal(
  name: string,
  operatorValue:
    typeof operatorO1,
  numericValue:
    typeof numeric10,
): AZProductionDescriptor {
  return {
    name,
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
            runtime.predefinedSymbols
              .inputLink,
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
            runtime.predefinedSymbols
              .operator,
        },
        value: {
          type: 'SYMBOL',
          symbol: operatorValue,
        },
        support: 'UNKNOWN',
      },
      {
        type: 'MAKE',
        preferenceType:
          'NUMERIC_INDIFFERENT',
        identifier: {
          type: 'SYMBOL',
          symbol: stateVariable,
        },
        attribute: {
          type: 'SYMBOL',
          symbol:
            runtime.predefinedSymbols
              .operator,
        },
        value: {
          type: 'SYMBOL',
          symbol: operatorValue,
        },
        referent: {
          type: 'SYMBOL',
          symbol: numericValue,
        },
        support: 'UNKNOWN',
      },
    ],
  }
}

const proposalO1 =
  runtime.productionRuntime
    .productionMaterializer
    .materialize(
      makeProposal(
        'controlled-rng-propose-o1',
        operatorO1,
        numeric10,
      ),
    )

const proposalO2 =
  runtime.productionRuntime
    .productionMaterializer
    .materialize(
      makeProposal(
        'controlled-rng-propose-o2',
        operatorO2,
        numeric20,
      ),
    )

assert.equal(
  runtime.productionRuntime
    .productionInstaller
    .install(proposalO1),
  'NO_REFRACTED_INSTANTIATION',
)

assert.equal(
  runtime.productionRuntime
    .productionInstaller
    .install(proposalO2),
  'NO_REFRACTED_INSTANTIATION',
)

let reachedQ = false

for (
  let step = 0;
  step < 12;
  step += 1
) {
  const phaseResult =
    runtime.phaseRuntime
      .phaseExecutor
      .executeOnePhase()

  if (
    phaseResult.executedPhase ===
      'PROPOSE' &&
    phaseResult.nextPhase ===
      'DECIDE'
  ) {
    reachedQ = true
    break
  }
}

assert.equal(
  reachedQ,
  true,
  'runtime must reach Q: PROPOSE -> DECIDE',
)

assert.equal(
  randomCalls,
  0,
  'candidate RNG must not be consumed before Q',
)

assert.equal(
  proposalO1.instantiations.length > 0,
  true,
  'O1 proposal production must fire',
)

assert.equal(
  proposalO2.instantiations.length > 0,
  true,
  'O2 proposal production must fire',
)

const operatorSlot =
  runtime.preferenceMemory.getSlot(
    rootGoal,
    runtime.predefinedSymbols.operator,
  )

assert.notEqual(
  operatorSlot,
  null,
  'operator slot must exist at Q',
)

if (operatorSlot === null) {
  throw new Error(
    'operator slot missing at Q',
  )
}

const acceptable =
  operatorSlot.preferencesByType
    .get('ACCEPTABLE') ?? []

const numeric =
  operatorSlot.preferencesByType
    .get('NUMERIC_INDIFFERENT') ?? []

assert.equal(
  acceptable.some(
    preference =>
      preference.value === operatorO1,
  ),
  true,
)

assert.equal(
  acceptable.some(
    preference =>
      preference.value === operatorO2,
  ),
  true,
)

assert.equal(
  numeric.some(
    preference =>
      preference.value === operatorO1 &&
      preference.referent === numeric10,
  ),
  true,
)

assert.equal(
  numeric.some(
    preference =>
      preference.value === operatorO2 &&
      preference.referent === numeric20,
  ),
  true,
)

const decideResult =
  runtime.phaseRuntime
    .phaseExecutor
    .executeOnePhase()

assert.equal(
  decideResult.executedPhase,
  'DECIDE',
)

assert.equal(
  decideResult.nextPhase,
  'APPLY',
)

assert.equal(
  randomCalls,
  1,
  'DECIDE must consume exactly one controlled draw',
)

const selectedOperators =
  runtime.workingMemory
    .getElements()
    .filter(
      wme =>
        wme.identifier === rootGoal &&
        wme.attribute ===
          runtime.predefinedSymbols.operator &&
        wme.acceptable === false,
    )

assert.equal(
  selectedOperators.length,
  1,
  'DECIDE must install exactly one operator',
)

/*
 * Do not infer expected identity from technical
 * identifier names. With the real PreferenceMemory
 * ordering, 0.75 over weights 10 and 20 selects O1,
 * as already established by the lower-level
 * decision-runtime behavioral proof.
 */
assert.equal(
  selectedOperators[0]?.value,
  operatorO1,
  'controlled draw 0.75 must select O1',
)

console.log(
  'AZ cognitive runtime controlled stochastic path: OK',
)
