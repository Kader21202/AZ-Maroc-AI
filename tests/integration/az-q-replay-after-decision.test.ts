import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZDefaultCandidateSelectionPolicy } from '../../src/engines/cognitive/az/core/decision/AZDefaultCandidateSelectionPolicy'
import { AZInputWmeManager } from '../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import { AZQStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZQStructuralStateExtractor'
import { ControlledRandomSequence } from '../../src/engines/cognitive/az/monitoring/ControlledRandomSequence'
import { DefaultQWitnessEquivalence } from '../../src/engines/cognitive/az/monitoring/QWitness'
import type { QWitness } from '../../src/engines/cognitive/az/monitoring/QWitness'

interface ReplayHistory {
  readonly stimulus: string
  readonly stochasticSequence:
    readonly number[]
  readonly secondWeight: number
}

interface ReplayResult {
  readonly witness: QWitness
  readonly rootGoalId: string
  readonly operatorIds:
    readonly string[]
  readonly normalInputCycles: number
}

const replay = (
  history: ReplayHistory,
  perturbTechnicalIdentity = false,
): ReplayResult => {
  const random =
    new ControlledRandomSequence(
      history.stochasticSequence,
    )

  const candidateSelectionPolicy =
    new AZDefaultCandidateSelectionPolicy(
      () => random.next(),
    )

  let injectInput:
    (() => void) | undefined

  let normalInputCycles = 0

  const runtime =
    new AZCognitiveRuntimeAssembly(
      () => {
        normalInputCycles += 1
        injectInput?.()
      },
      undefined,
      candidateSelectionPolicy,
    )

  if (perturbTechnicalIdentity) {
    runtime.symbolManager
      .makeIdentifier('UNRELATED')

    runtime.symbolManager
      .makeStringConstant(
        'unrelated-constant',
      )
  }

  const rootGoal =
    runtime.symbolManager
      .makeIdentifier('S')

  runtime.decisionRuntime
    .goalContextInitializer
    .initialize(
      rootGoal,
      1,
    )

  runtime.contextStack.setTop(
    rootGoal,
  )

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

  assert.notEqual(
    inputLink,
    null,
  )

  if (inputLink === null) {
    throw new Error(
      'AZ input link was not initialized',
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

  const stimulusAttribute =
    symbols.makeStringConstant(
      'stimulus',
    )

  const stimulusValue =
    symbols.makeStringConstant(
      history.stimulus,
    )

  const operatorO1 =
    symbols.makeIdentifier('O')

  const operatorO2 =
    symbols.makeIdentifier('O')

  const numeric10 =
    symbols.makeIntegerConstant(10)

  const numeric20 =
    symbols.makeIntegerConstant(history.secondWeight)

  let inputInjected = false

  injectInput = () => {
    if (inputInjected) {
      return
    }

    inputWmeManager.add(
      inputLink,
      stimulusAttribute,
      stimulusValue,
    )

    inputInjected = true
  }

  const makeProposal = (
    name: string,
    operatorValue:
      typeof operatorO1,
    numericValue:
      typeof numeric10,
  ): AZProductionDescriptor => ({
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
  })

  const proposalO1 =
    runtime.productionRuntime
      .productionMaterializer
      .materialize(
        makeProposal(
          'replay-propose-o1',
          operatorO1,
          numeric10,
        ),
      )

  const proposalO2 =
    runtime.productionRuntime
      .productionMaterializer
      .materialize(
        makeProposal(
          'replay-propose-o2',
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
    'replay must reach natural Q',
  )

  assert.equal(
    inputInjected,
    true,
    'input must be injected by NORMAL_INPUT_CYCLE',
  )

  assert.equal(
    random.currentIndex(),
    0,
    'candidate RNG must remain unconsumed at Q',
  )

  let reachedSecondQ = false

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
      phaseResult.executedPhase ===
        'PROPOSE' &&
      phaseResult.nextPhase ===
        'DECIDE'
    ) {
      reachedSecondQ = true
      break
    }
  }
assert.equal(
    reachedSecondQ,
    true,
    'replay must reach second natural Q',
  )

  assert.equal(
    random.currentIndex(),
    1,
    'second Q must preserve exactly one consumed controlled draw',
  )
  const structuralState =
    new AZQStructuralStateExtractor()
      .extract(
        runtime.workingMemory,
        runtime.preferenceMemory,
        runtime.productionRuntime.matchSet,
      )

  return {
    witness: {
      structuralState,
      stochasticIndex:
        random.currentIndex(),
    },
    rootGoalId:
      rootGoal.id,
    operatorIds: [
      operatorO1.id,
      operatorO2.id,
    ],
    normalInputCycles,
  }
}

const history: ReplayHistory = {
  stimulus: 'controlled-rng',
  stochasticSequence: [0.75],
  secondWeight: 20,
}

const first =
  replay(history)

const second =
  replay(
    history,
    true,
  )

const equivalence =
  new DefaultQWitnessEquivalence()

assert.notEqual(
  first.rootGoalId,
  second.rootGoalId,
  'fresh replays must not share technical goal identity',
)

assert.notDeepEqual(
  first.operatorIds,
  second.operatorIds,
  'fresh replays must not share technical operator identities',
)

assert.equal(
  first.normalInputCycles > 0,
  true,
  'first replay must cross NORMAL_INPUT_CYCLE',
)

assert.equal(
  second.normalInputCycles > 0,
  true,
  'second replay must cross NORMAL_INPUT_CYCLE',
)

assert.equal(
  equivalence.equivalent(
    first.witness,
    second.witness,
  ),
  true,
  'same causal history must reconstruct an equivalent Q',
)

const causallyDifferent =
  replay({
    ...history,
    secondWeight: 30,
  })

assert.equal(
  equivalence.equivalent(
    first.witness,
    causallyDifferent.witness,
  ),
  false,
  'causally different replay history must not reconstruct an equivalent Q',
)
console.log(
  'AZ Q replay reconstruction: OK',
)
