import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import { PersistentContinuationMemoryInjector } from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryInjector'

import { AZEpisodicMemoryStore } from './AZEpisodicMemoryStore'
import { AZEpisodicMemoryRetriever } from './AZEpisodicMemoryRetriever'

type Action = 'contourner' | 'avancer'
type Outcome = 'succes' | 'echec'

interface Scenario {
  name: string
  context: string
  episodeContext?: string
  action?: Action
  outcome?: Outcome
  expected: Action | null
}

const scenarios: Scenario[] = [
  {
    name: 'A',
    context: 'obstacle',
    episodeContext: 'obstacle',
    action: 'contourner',
    outcome: 'succes',
    expected: 'contourner',
  },
  {
    name: 'B',
    context: 'obstacle',
    episodeContext: 'obstacle',
    action: 'avancer',
    outcome: 'succes',
    expected: 'avancer',
  },
  {
    name: 'C',
    context: 'obstacle',
    episodeContext: 'obstacle',
    action: 'contourner',
    outcome: 'echec',
    expected: null,
  },
  {
    name: 'D',
    context: 'obstacle',
    episodeContext: 'terrain-libre',
    action: 'contourner',
    outcome: 'succes',
    expected: null,
  },
]

function runScenario(scenario: Scenario): void {
  const store = new AZEpisodicMemoryStore()

  if (
    scenario.episodeContext &&
    scenario.action &&
    scenario.outcome
  ) {
    assert.equal(store.add({
      id: 'E1',
      timestamp: '2026-10-13T20:00:00.000Z',
      context: scenario.episodeContext,
      action: scenario.action,
      outcome: scenario.outcome,
      memory: {
        root: 'm0',
        elements: [
          {
            identifier: 'm0',
            attribute: {
              type: 'STRING_CONSTANT',
              value: 'action',
            },
            value: {
              type: 'STRING_CONSTANT',
              value: scenario.action,
            },
            acceptable: false,
          },
          {
            identifier: 'm0',
            attribute: {
              type: 'STRING_CONSTANT',
              value: 'outcome',
            },
            value: {
              type: 'STRING_CONSTANT',
              value: scenario.outcome,
            },
            acceptable: false,
          },
        ],
      },
    }), true)
  }

  const recalled = new AZEpisodicMemoryRetriever()
    .retrieve(store, scenario.context)

  let injected = false
  let inject = () => {}

  const runtime = new AZCognitiveRuntimeAssembly(() => {
    if (!injected) {
      inject()
      injected = true
    }
  })

  const symbols = runtime.symbolManager
  const rootGoal = symbols.makeIdentifier('S')

  runtime.decisionRuntime.goalContextInitializer.initialize(
    rootGoal,
    1,
  )
  runtime.contextStack.setTop(rootGoal)
  runtime.stateStack.setTop({}, rootGoal)

  const inputManager = new AZInputWmeManager(
    runtime.workingMemory,
    new AZInputWmeRegistry(),
  )

  new AZIoStructureInitializer(
    symbols,
    runtime.predefinedSymbols,
    inputManager,
    runtime.identifierStateRegistry,
  ).initialize(rootGoal, runtime.ioState)

  const inputLink = runtime.ioState.inputLink
  if (!inputLink) throw new Error('Missing input-link')

  inject = () => {
    if (recalled.length === 0) return

    new PersistentContinuationMemoryInjector().inject(
      recalled[0].memory,
      inputLink,
      symbols,
      runtime.identifierStateRegistry,
      inputManager,
    )
  }

  const state = symbols.makeVariable('s')
  const io = symbols.makeVariable('io')
  const il = symbols.makeVariable('il')
  const memory = symbols.makeVariable('memory')

  const operators = {
    contourner: symbols.makeIdentifier('O'),
    avancer: symbols.makeIdentifier('O'),
  }

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

  for (const action of ['contourner', 'avancer'] as const) {
    const production: AZProductionDescriptor = {
      name: `az-d1-m2-episodic-${action}`,
      declaredSupport: 'I_SUPPORT',
      conditions: [
        condition(
          state,
          runtime.predefinedSymbols.io,
          io,
        ),
        condition(
          io,
          runtime.predefinedSymbols.inputLink,
          il,
        ),
        condition(
          il,
          symbols.makeStringConstant('persistent-memory'),
          memory,
        ),
        condition(
          memory,
          symbols.makeStringConstant('action'),
          symbols.makeStringConstant(action),
        ),
        condition(
          memory,
          symbols.makeStringConstant('outcome'),
          symbols.makeStringConstant('succes'),
        ),
      ],
      actions: [{
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: state,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: runtime.predefinedSymbols.operator,
        },
        value: {
          type: 'SYMBOL',
          symbol: operators[action],
        },
        support: 'UNKNOWN',
      }],
    }

    const materialized =
      runtime.productionRuntime.productionMaterializer
        .materialize(production)

    assert.equal(
      runtime.productionRuntime.productionInstaller
        .install(materialized),
      'NO_REFRACTED_INSTANTIATION',
    )
  }

  let selected: Action | null = null
  let sawUnexpectedOperator = false

  for (let step = 0; step < 30; step++) {
    runtime.phaseRuntime.phaseExecutor.executeOnePhase()

    const operatorWmes =
      runtime.workingMemory.getElements().filter(wme =>
        wme.identifier === rootGoal &&
        wme.attribute === runtime.predefinedSymbols.operator
      )

    const selectedWmes =
      operatorWmes.filter(wme => wme.acceptable === false)

    const acceptableWmes =
      operatorWmes.filter(wme => wme.acceptable === true)

    assert.ok(
      selectedWmes.length <= 1,
      `${scenario.name}: multiple selected operators at phase ${step}`,
    )

    const operatorSlot =
      runtime.structuralRegistry.get(rootGoal).operatorSlot

    assert.deepEqual(
      operatorSlot?.wmes.map(wme => wme.timetag) ?? [],
      selectedWmes.map(wme => wme.timetag),
      `${scenario.name}: selected operator differs from slot at phase ${step}`,
    )

    assert.deepEqual(
      (operatorSlot?.acceptablePreferenceWmes ?? [])
        .map(wme => wme.timetag).sort((a, b) => a - b),
      acceptableWmes
        .map(wme => wme.timetag).sort((a, b) => a - b),
      `${scenario.name}: acceptable preferences differ from slot at phase ${step}`,
    )

    for (const wme of selectedWmes) {
      if (wme.value === operators.contourner) {
        selected = 'contourner'
      } else if (wme.value === operators.avancer) {
        selected = 'avancer'
      } else {
        sawUnexpectedOperator = true
      }
    }


  }

  assert.equal(
    injected,
    true,
    `${scenario.name}: input cycle not executed`,
  )

  assert.equal(
    recalled.length,
    scenario.name === 'D' ? 0 : 1,
    `${scenario.name}: unexpected retrieval`,
  )

  assert.equal(
    sawUnexpectedOperator,
    false,
    `${scenario.name}: unexpected operator`,
  )

  assert.equal(
    selected,
    scenario.expected,
    `${scenario.name}: incorrect cognitive decision`,
  )

  console.log(
    `AZ-D1-M2.7-C ${scenario.name}: PASS (${selected ?? 'aucun'})`,
  )
}

for (const scenario of scenarios) {
  runScenario(scenario)
}

console.log('AZ-D1-M2.7-C COMPARATIVE DECISION: PASS')




