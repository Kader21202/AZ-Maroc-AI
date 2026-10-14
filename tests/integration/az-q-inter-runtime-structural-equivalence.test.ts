import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZQStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZQStructuralStateExtractor'
import { DefaultQStructuralStateCanonicalizer } from '../../src/engines/cognitive/az/monitoring/DefaultQStructuralStateCanonicalizer'
import { DefaultQWitnessEquivalence } from '../../src/engines/cognitive/az/monitoring/QWitness'
import type { QStructuralStateObservation } from '../../src/engines/cognitive/az/monitoring/QStructuralStateObservation'

interface QState {
  readonly rootGoalId: string
  readonly operatorId: string
  readonly observation:
    QStructuralStateObservation
}

const buildQState = (
  perturbTechnicalIdentity = false,
  sourceNumericValue = 42,
): QState => {
  const runtime =
    new AZCognitiveRuntimeAssembly()

  if (perturbTechnicalIdentity) {
    runtime.symbolManager.makeIdentifier('UNRELATED')
    runtime.symbolManager.makeStringConstant(
      'unrelated-constant',
    )
  }

  const topCreator =
    new AZTopContextCreator(
      runtime.symbolManager,
      runtime.predefinedSymbols,
      runtime.workingMemory,
      runtime.contextStack,
      runtime.stateStack,
      runtime.decisionRuntime
        .goalContextInitializer,
      runtime.structuralRegistry,
    )

  const rootGoal =
    topCreator.create().goal

  const symbols =
    runtime.symbolManager

  const stateVariable =
    symbols.makeVariable('<s>')

  const valueAttribute =
    symbols.makeStringConstant('value')

  const sourceValue =
    symbols.makeIntegerConstant(sourceNumericValue)

  const operator =
    symbols.makeIdentifier('O')

  const eq = (
    symbol: AZSymbol,
  ): AZProductionTest => ({
    type: 'EQUALITY',
    referent: symbol,
  })

  const proposal: AZProduction = {
    name: 'az-q-equivalence-proposal',
    declaredSupport: 'I_SUPPORT',
    conditions: [
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'CONJUNCTIVE',
          conjuncts: [
            eq(stateVariable),
            {
              type: 'GOAL_ID',
            },
          ],
        },
        attributeTest:
          eq(valueAttribute),
        valueTest:
          eq(sourceValue),
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
          symbol: operator,
        },
        support: 'UNKNOWN',
      },
    ],
    instantiations: [],
  }

  assert.equal(
    runtime.productionRuntime
      .productionInstaller
      .install(proposal),
    'NO_REFRACTED_INSTANTIATION',
  )

  const source =
    runtime.workingMemory.createElement(
      rootGoal,
      valueAttribute,
      sourceValue,
      false,
    )

  runtime.workingMemory.scheduleAdd(source)
  runtime.workingMemory.applyBufferedChanges()

  let reachedQ = false

  for (
    let step = 0;
    step < 25;
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
    'runtime must reach Q immediately before DECIDE',
  )

  const observation =
    new AZQStructuralStateExtractor()
      .extract(
        runtime.workingMemory,
        runtime.preferenceMemory,
        runtime.productionRuntime.matchSet,
      )

  const acceptablePreferences =
    observation.preferenceSlots
      .flatMap(
        slot => slot.preferences,
      )
      .filter(
        preference =>
          preference.type ===
          'ACCEPTABLE',
      )

  assert.equal(
    acceptablePreferences.length > 0,
    true,
    'Q must contain a real ACCEPTABLE preference produced by elaboration',
  )

  return {
    rootGoalId: rootGoal.id,
    operatorId: operator.id,
    observation,
  }
}

const first =
  buildQState()

const second =
  buildQState(true)

const causallyDifferent =
  buildQState(false, 43)

assert.notEqual(
  first.rootGoalId,
  second.rootGoalId,
  'independent runtimes must use different technical goal identities',
)

assert.notEqual(
  first.operatorId,
  second.operatorId,
  'independent runtimes must use different technical operator identities',
)

assert.equal(
  first.observation.workingMemory.length,
  second.observation.workingMemory.length,
)

assert.equal(
  first.observation.preferenceSlots.length,
  second.observation.preferenceSlots.length,
)

const canonicalizer =
  new DefaultQStructuralStateCanonicalizer()

assert.equal(
  canonicalizer.canonicalize(first.observation),
  canonicalizer.canonicalize(second.observation),
  'equivalent Q states must canonicalize identically despite different technical symbol identities',
)

assert.notEqual(
  canonicalizer.canonicalize(first.observation),
  canonicalizer.canonicalize(causallyDifferent.observation),
  'causally different Q states must not canonicalize identically',
)

const witnessEquivalence =
  new DefaultQWitnessEquivalence()

assert.equal(
  witnessEquivalence.equivalent(
    {
      structuralState: first.observation,
      stochasticIndex: 0,
    },
    {
      structuralState: second.observation,
      stochasticIndex: 0,
    },
  ),
  true,
  'same logical Q and same stochastic index must be Q-equivalent',
)

assert.equal(
  witnessEquivalence.equivalent(
    {
      structuralState: first.observation,
      stochasticIndex: 0,
    },
    {
      structuralState: second.observation,
      stochasticIndex: 1,
    },
  ),
  false,
  'same logical Q with different stochastic index must not be Q-equivalent',
)

assert.equal(
  witnessEquivalence.equivalent(
    {
      structuralState: first.observation,
      stochasticIndex: 0,
    },
    {
      structuralState:
        causallyDifferent.observation,
      stochasticIndex: 0,
    },
  ),
  false,
  'causally different Q states must not be Q-equivalent',
)

console.log(
  'AZ Q inter-runtime structural preconditions: OK',
)
