import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeManager } from '../../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoStructureInitializer } from '../../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import type { AZProductionDescriptor } from '../../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import { PersistentContinuationMemoryInjector } from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemoryInjector'

import { AZEpisodicMemoryStore } from '../az-d1-m2/AZEpisodicMemoryStore'
import { AZEpisodicMemoryRetriever } from '../az-d1-m2/AZEpisodicMemoryRetriever'

type Action = 'avancer' | 'contourner'

interface Scenario {
  name: string
  rememberedAction: Action | null
}

const scenarios: Scenario[] = [
  { name: 'SANS_MEMOIRE', rememberedAction: null },
  { name: 'MEMOIRE_CONTOURNER', rememberedAction: 'contourner' },
  { name: 'MEMOIRE_AVANCER', rememberedAction: 'avancer' },
]

function runScenario(scenario: Scenario): void {
  const store = new AZEpisodicMemoryStore()

  if (scenario.rememberedAction !== null) {
    const action = scenario.rememberedAction

    assert.equal(store.add({
      id: 'E1',
      timestamp: '2026-10-13T20:00:00.000Z',
      context: 'obstacle',
      action,
      outcome: 'succes',
      memory: {
        root: 'm0',
        elements: [
          {
            identifier: 'm0',
            attribute: { type: 'STRING_CONSTANT', value: 'action' },
            value: { type: 'STRING_CONSTANT', value: action },
            acceptable: false,
          },
          {
            identifier: 'm0',
            attribute: { type: 'STRING_CONSTANT', value: 'outcome' },
            value: { type: 'STRING_CONSTANT', value: 'succes' },
            acceptable: false,
          },
        ],
      },
    }), true)
  }

  const recalled = new AZEpisodicMemoryRetriever()
    .retrieve(store, 'obstacle')

  assert.equal(
    recalled.length,
    scenario.rememberedAction === null ? 0 : 1,
  )

  let inputCycleExecuted = false
  let inject = () => {}

  const runtime = new AZCognitiveRuntimeAssembly(() => {
    if (!inputCycleExecuted) {
      inject()
      inputCycleExecuted = true
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

  const operators = {
    avancer: symbols.makeIdentifier('O'),
    contourner: symbols.makeIdentifier('O'),
  }

  const state = symbols.makeVariable('s')
  const io = symbols.makeVariable('io')
  const il = symbols.makeVariable('il')
  const memory = symbols.makeVariable('memory')

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

  const installedProductions: Array<
    ReturnType<typeof runtime.productionRuntime.productionMaterializer.materialize>
  > = []

  function install(production: AZProductionDescriptor): void {
    const materialized =
      runtime.productionRuntime.productionMaterializer
        .materialize(production)

    assert.equal(
      runtime.productionRuntime.productionInstaller
        .install(materialized),
      'NO_REFRACTED_INSTANTIATION',
    )

    installedProductions.push(materialized)
  }

  // Both proposals exist independently of episodic memory.
  for (const action of ['avancer', 'contourner'] as const) {
    install({
      name: `m3-b1-propose-${action}`,
      declaredSupport: 'I_SUPPORT',
      conditions: [
        condition(state, runtime.predefinedSymbols.io, io),
      ],
      actions: [{
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: { type: 'SYMBOL', symbol: state },
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
    })
  }

  // Identical memory-to-preference rules in every scenario.
  for (const action of ['avancer', 'contourner'] as const) {
    const other: Action =
      action === 'avancer' ? 'contourner' : 'avancer'

    install({
      name: `m3-b1-prefer-${action}-from-memory`,
      declaredSupport: 'I_SUPPORT',
      conditions: [
        condition(state, runtime.predefinedSymbols.io, io),
        condition(io, runtime.predefinedSymbols.inputLink, il),
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
        preferenceType: 'BETTER',
        identifier: { type: 'SYMBOL', symbol: state },
        attribute: {
          type: 'SYMBOL',
          symbol: runtime.predefinedSymbols.operator,
        },
        value: {
          type: 'SYMBOL',
          symbol: operators[action],
        },
        referent: {
          type: 'SYMBOL',
          symbol: operators[other],
        },
        support: 'UNKNOWN',
      }],
    })
  }

  let sawTwoProposals = false
  let sawTie = false
  let sawExpectedBetter = false
  let selected: Action | null = null

  for (let phase = 0; phase < 100; phase++) {
    runtime.phaseRuntime.phaseExecutor.executeOnePhase()

    const operatorWmes =
      runtime.workingMemory.getElements().filter(wme =>
        wme.identifier === rootGoal &&
        wme.attribute === runtime.predefinedSymbols.operator
      )

    const proposals = operatorWmes.filter(wme => wme.acceptable)
    const selections = operatorWmes.filter(wme => !wme.acceptable)

    assert.ok(
      selections.length <= 1,
      `${scenario.name}: multiple selected operators`,
    )

    if (
      proposals.some(wme => wme.value === operators.avancer) &&
      proposals.some(wme => wme.value === operators.contourner)
    ) {
      sawTwoProposals = true
    }

    const slot =
      runtime.structuralRegistry.get(rootGoal).operatorSlot

    if (slot?.impasseType === 'TIE') {
      sawTie = true
    }

    if (scenario.rememberedAction !== null) {
      const preferred = operators[scenario.rememberedAction]
      const other =
        operators[
          scenario.rememberedAction === 'avancer'
            ? 'contourner'
            : 'avancer'
        ]

      const generatedPreferences =
        installedProductions
          .flatMap(production =>
            production.instantiations.flatMap(instantiation =>
              instantiation.generatedPreferences
            )
          )

      if (generatedPreferences.some(preference =>
        preference.type === 'BETTER' &&
        preference.identifier === rootGoal &&
        preference.attribute === runtime.predefinedSymbols.operator &&
        preference.value === preferred &&
        preference.referent === other
      )) {
        sawExpectedBetter = true
      }
    }

    for (const wme of selections) {
      if (wme.value === operators.avancer) {
        selected = 'avancer'
      } else if (wme.value === operators.contourner) {
        selected = 'contourner'
      } else {
        assert.fail(`${scenario.name}: unknown operator selected`)
      }
    }

    if (selected !== null) break
  }

  assert.equal(inputCycleExecuted, true)
  assert.equal(sawTwoProposals, true)

  if (scenario.rememberedAction === null) {
    assert.equal(sawTie, true)
    assert.equal(sawExpectedBetter, false)
    assert.equal(selected, null)
  } else {
    assert.equal(
      sawExpectedBetter,
      true,
      `${scenario.name}: memory did not generate BETTER`,
    )
    assert.equal(
      selected,
      scenario.rememberedAction,
      `${scenario.name}: decision did not follow memory preference`,
    )
  }

  console.log('M3.2-B1 RESULT', {
    scenario: scenario.name,
    recalled: recalled.length,
    twoProposals: sawTwoProposals,
    tieObserved: sawTie,
    memoryBetterGenerated: sawExpectedBetter,
    selected: selected ?? 'aucun',
  })
}

for (const scenario of scenarios) {
  runScenario(scenario)
}

console.log('AZ-D1-M3.2-B1 MEMORY CAUSAL DECISION: PASS')

