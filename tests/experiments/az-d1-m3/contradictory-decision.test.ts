import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import { PersistentContinuationMemoryInjector } from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryInjector'

import { AZEpisodicMemoryStore } from '../az-d1-m2/AZEpisodicMemoryStore'
import { AZEpisodicMemoryRetriever } from '../az-d1-m2/AZEpisodicMemoryRetriever'

type Action = 'contourner' | 'avancer'
type Outcome = 'succes' | 'echec'

interface Scenario {
  name: string
  context: string
}

const scenarios: Scenario[] = [
  { name: 'CONTRADICTORY', context: 'obstacle' },
]
function runScenario(scenario: Scenario): void {
  const store = new AZEpisodicMemoryStore()

  const episodes = [
    { id: 'E1', action: 'contourner', outcome: 'succes' },
    { id: 'E2', action: 'avancer', outcome: 'succes' },
    { id: 'E3', action: 'contourner', outcome: 'echec' },
  ] as const

  for (const episode of episodes) {
    assert.equal(store.add({
      ...episode,
      timestamp: '2026-10-13T20:00:00.000Z',
      context: 'obstacle',
      memory: {
        root: 'm0',
        elements: [
          {
            identifier: 'm0',
            attribute: { type: 'STRING_CONSTANT', value: 'episode-id' },
            value: { type: 'STRING_CONSTANT', value: episode.id },
            acceptable: false,
          },
          {
            identifier: 'm0',
            attribute: { type: 'STRING_CONSTANT', value: 'action' },
            value: { type: 'STRING_CONSTANT', value: episode.action },
            acceptable: false,
          },
          {
            identifier: 'm0',
            attribute: { type: 'STRING_CONSTANT', value: 'outcome' },
            value: { type: 'STRING_CONSTANT', value: episode.outcome },
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
    const injector = new PersistentContinuationMemoryInjector()

    for (const episode of recalled) {
      injector.inject(
        episode.memory,
        inputLink,
        symbols,
        runtime.identifierStateRegistry,
        inputManager,
      )
    }
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
  let observedTwoProposals = false
  let observedTie = false

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

    console.log('M3.2 TRACE', {
      scenario: scenario.name,
      phase: step,
      proposals: acceptableWmes.map(wme => String(wme.value)),
      selected: selectedWmes.map(wme => String(wme.value)),
    })
    if (
      acceptableWmes.length === 2 &&
      acceptableWmes.some(wme => wme.value === operators.contourner) &&
      acceptableWmes.some(wme => wme.value === operators.avancer)
    ) {
      observedTwoProposals = true
    }

    const operatorSlot =
      runtime.structuralRegistry.get(rootGoal).operatorSlot

    if (operatorSlot?.impasseType === 'TIE') {
      observedTie = true
    }

    assert.equal(
      selectedWmes.length,
      0,
      `${scenario.name}: unexpected operator selection`,
    )

    console.log('M3.2 IMPASSE', {
      scenario: scenario.name,
      phase: step,
      type: operatorSlot?.impasseType ?? 'NON_DEFINI',
    })
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
    3,
    `${scenario.name}: three episodes must be retrieved`,
  )

  assert.equal(observedTwoProposals, true, 'Two competing proposals not observed')
  assert.equal(observedTie, true, 'TIE impasse not observed')
  assert.equal(selected, null, 'An operator was unexpectedly selected')

  assert.equal(
    sawUnexpectedOperator,
    false,
    `${scenario.name}: unexpected operator`,
  )

  console.log(
    `AZ-D1-M3.2-A ${scenario.name}: selected=${selected ?? 'aucun'}`,
  )
}

for (const scenario of scenarios) {
  runScenario(scenario)
}

console.log('AZ-D1-M3.2-A CONTRADICTORY DECISION: PASS')
