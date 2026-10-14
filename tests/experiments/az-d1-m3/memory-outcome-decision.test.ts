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
  rememberedActions: readonly Action[]
  expected: Action | 'TIE' | 'CONFLICT'
}

const scenarios: Scenario[] = [
  {
    name: 'SANS_MEMOIRE',
    rememberedActions: [],
    expected: 'TIE',
  },
  {
    name: 'MEMOIRE_CONTOURNER',
    rememberedActions: ['contourner'],
    expected: 'contourner',
  },
  {
    name: 'MEMOIRE_AVANCER',
    rememberedActions: ['avancer'],
    expected: 'avancer',
  },
  {
    name: 'MEMOIRES_CONTRADICTOIRES',
    rememberedActions: ['contourner', 'avancer'],
    expected: 'CONFLICT',
  },  {
    name: 'SUCCES_ET_ECHEC',
    rememberedActions: ['contourner', 'avancer', 'contourner'],
    expected: 'CONFLICT',
  },
]

function runScenario(scenario: Scenario): void {
  const store = new AZEpisodicMemoryStore()

  for (const [index, action] of scenario.rememberedActions.entries()) {
    assert.equal(store.add({
      id: `E${index + 1}`,
      timestamp: '2026-10-13T20:00:00.000Z',
      context: 'obstacle',
      action,
      outcome: index === 2 ? 'echec' : 'succes',
      memory: {
        root: 'm0',
        elements: [
          {
            identifier: 'm0',
            attribute: { type: 'STRING_CONSTANT', value: 'episode-id' },
            value: {
              type: 'STRING_CONSTANT',
              value: `E${index + 1}`,
            },
            acceptable: false,
          },
          {
            identifier: 'm0',
            attribute: { type: 'STRING_CONSTANT', value: 'action' },
            value: { type: 'STRING_CONSTANT', value: action },
            acceptable: false,
          },
          {
            identifier: 'm0',
            attribute: { type: 'STRING_CONSTANT', value: 'outcome' },
            value: { type: 'STRING_CONSTANT', value: index === 2 ? 'echec' : 'succes' },
            acceptable: false,
          },
        ],
      },
    }), true)
  }

  const recalled = new AZEpisodicMemoryRetriever()
    .retrieve(store, 'obstacle')

  assert.equal(recalled.length, scenario.rememberedActions.length)
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
  let sawConflict = false
  let selected: Action | null = null

  const observedBetter = new Set<Action>()

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

    if (slot?.impasseType === 'TIE') sawTie = true
    if (slot?.impasseType === 'CONFLICT') sawConflict = true

    const generatedPreferences =
      installedProductions.flatMap(production =>
        production.instantiations.flatMap(instantiation =>
          instantiation.generatedPreferences
        )
      )

    for (const action of ['avancer', 'contourner'] as const) {
      const other =
        action === 'avancer' ? 'contourner' : 'avancer'

      if (generatedPreferences.some(preference =>
        preference.type === 'BETTER' &&
        preference.identifier === rootGoal &&
        preference.attribute === runtime.predefinedSymbols.operator &&
        preference.value === operators[action] &&
        preference.referent === operators[other]
      )) {
        observedBetter.add(action)
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

  const allWmes = runtime.workingMemory.getElements()

  const memoryRoots = allWmes.filter(wme =>
    wme.identifier === inputLink &&
    wme.attribute === symbols.makeStringConstant('persistent-memory')
  )

  assert.equal(
    memoryRoots.length,
    recalled.length,
    `${scenario.name}: incorrect number of injected memory roots`,
  )

  const expectedEpisodes = recalled.map(episode => ({
    id: episode.id,
    action: episode.action,
    outcome: episode.outcome,
  }))

  const actualEpisodes = memoryRoots.map(rootWme => {
    const fields = allWmes.filter(wme =>
      wme.identifier === rootWme.value
    )

    const readField = (name: string): string => {
      const field = fields.find(wme =>
        wme.attribute === symbols.makeStringConstant(name)
      )

      assert.ok(
        field,
        `${scenario.name}: missing memory field ${name}`,
      )

      assert.equal(field.value.type, 'STRING_CONSTANT')
      assert.equal(typeof field.value.value, 'string')
      return field.value.value as string
    }

    return {
      id: readField('episode-id'),
      action: readField('action'),
      outcome: readField('outcome'),
    }
  })

  assert.deepEqual(
    actualEpisodes.sort((a, b) => a.id.localeCompare(b.id)),
    expectedEpisodes.sort((a, b) => a.id.localeCompare(b.id)),
    `${scenario.name}: injected episodes differ from recalled episodes`,
  )

  assert.equal(
    new Set(memoryRoots.map(wme => wme.value)).size,
    recalled.length,
    `${scenario.name}: episode roots are not distinct`,
  )
  assert.equal(inputCycleExecuted, true)
  assert.equal(sawTwoProposals, true)

  for (const action of ['avancer', 'contourner'] as const) {
    assert.equal(
      observedBetter.has(action),
      scenario.rememberedActions.includes(action),
      `${scenario.name}: unexpected BETTER preference for ${action}`,
    )
  }

  if (scenario.expected === 'TIE') {
    assert.equal(sawTie, true)
    assert.equal(selected, null)
  } else if (scenario.expected === 'CONFLICT') {
    assert.equal(sawConflict, true)
    assert.equal(selected, null)
  } else {
    assert.equal(selected, scenario.expected)
  }

  console.log('M3.2-B2 RESULT', {
    scenario: scenario.name,
    recalled: recalled.length,
    twoProposals: sawTwoProposals,
    tieObserved: sawTie,
    conflictObserved: sawConflict,
    betterGenerated: [...observedBetter].sort(),
    selected: selected ?? 'aucun',
  })
}

for (const scenario of scenarios) {
  runScenario(scenario)
}

console.log('AZ-D1-M3.2-B3-A MEMORY OUTCOME OBSERVATION: PASS')





