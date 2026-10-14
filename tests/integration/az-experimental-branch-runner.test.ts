import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZDefaultCandidateSelectionPolicy } from '../../src/engines/cognitive/az/core/decision/AZDefaultCandidateSelectionPolicy'
import { AZInputWmeManager } from '../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import { AZQStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZQStructuralStateExtractor'
import { ControlledRandomSequence } from '../../src/engines/cognitive/az/monitoring/ControlledRandomSequence'
import { ExperimentalBranchRunner } from '../../src/engines/cognitive/az/monitoring/ExperimentalBranchRunner'
import { DefaultQWitnessEquivalence } from '../../src/engines/cognitive/az/monitoring/QWitness'
import type { QWitness } from '../../src/engines/cognitive/az/monitoring/QWitness'

interface ReplayHistory {
  readonly stimulus: string
  readonly stochasticSequence:
    readonly number[]
  readonly secondWeight: number
}

interface ReplayResult {
  readonly runtime: AZCognitiveRuntimeAssembly
  readonly rootGoal: ReturnType<AZCognitiveRuntimeAssembly['symbolManager']['makeIdentifier']>
  readonly operatorO2: ReturnType<AZCognitiveRuntimeAssembly['symbolManager']['makeIdentifier']>
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

  const structuralState =
    new AZQStructuralStateExtractor()
      .extract(
        runtime.workingMemory,
        runtime.preferenceMemory,
        runtime.productionRuntime.matchSet,
      )

  return {
    runtime,
    rootGoal,
    operatorO2,
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




const branch = replay(history)

let interventionCalls = 0
let removedO2 = false

const result =
  new ExperimentalBranchRunner().run({
    runtime: branch.runtime,
    horizonCycles: 1,
    intervention: {
      apply(runtime) {
        interventionCalls += 1

        const operatorSlot =
          runtime.preferenceMemory.getSlot(
            branch.rootGoal,
            runtime.predefinedSymbols.operator,
          )

        assert.notEqual(
          operatorSlot,
          null,
          'operator slot must exist at Q',
        )

        if (operatorSlot === null) {
          throw new Error(
            'Operator slot missing at experimental Q',
          )
        }

        const target =
          (
            operatorSlot.preferencesByType
              .get('ACCEPTABLE') ?? []
          ).find(
            preference =>
              preference.value ===
              branch.operatorO2,
          )

        assert.notEqual(
          target,
          undefined,
          'real O2 ACCEPTABLE preference must exist at Q',
        )

        if (target === undefined) {
          throw new Error(
            'O2 ACCEPTABLE preference missing at experimental Q',
          )
        }

        removedO2 =
          runtime.preferenceMemory
            .remove(target)

        assert.equal(
          removedO2,
          true,
          'native preference removal must succeed',
        )
      },
    },
  })

assert.equal(
  interventionCalls,
  1,
  'branch intervention must execute exactly once',
)

assert.equal(
  removedO2,
  true,
  'branch must remove the targeted real O2 preference',
)

assert.ok(
  result.observations.length > 0,
  'one completed continuation cycle must contain observed native phases',
)

const lastObservation =
  result.observations[
    result.observations.length - 1
  ]

assert.equal(
  lastObservation?.phase.executedPhase,
  'OUTPUT',
  'horizonCycles=1 must end after OUTPUT',
)

assert.equal(
  lastObservation?.phase.nextPhase,
  'INPUT',
  'horizonCycles=1 must end exactly at the OUTPUT-to-INPUT continuation boundary',
)

assert.equal(
  result.observations[0]?.phase.executedPhase,
  'DECIDE',
  'first continuation phase after natural Q must be DECIDE',
)

assert.equal(
  result.stoppingReason,
  'HORIZON',
  'non-halted branch must stop at its predefined continuation-cycle horizon',
)

const operatorSlotAfter =
  branch.runtime.preferenceMemory.getSlot(
    branch.rootGoal,
    branch.runtime.predefinedSymbols.operator,
  )

assert.equal(
  (
    operatorSlotAfter?.preferencesByType
      .get('ACCEPTABLE') ?? []
  ).some(
    preference =>
      preference.value === branch.operatorO2,
  ),
  false,
  'targeted O2 ACCEPTABLE preference must remain absent after the branch step',
)

console.log(
  'AZ experimental branch runner: OK',
)
