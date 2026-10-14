import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZTopContextCreator } from '../../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZProductionDescriptor } from '../../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import type { AZProductionCondition } from '../../../src/engines/cognitive/az/core/production/AZProductionCondition'
import type { AZProductionRhsValue } from '../../../src/engines/cognitive/az/core/production/AZProductionRhsValue'
import type { AZProductionTest } from '../../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../../src/engines/cognitive/az/core/symbols/AZSymbol'

interface CognitiveCase {
  readonly startValue: number
  readonly increments: number
  readonly expected: number
  readonly episodeCount: number
  readonly expectHalt: boolean
}

const cases: readonly CognitiveCase[] = [
  { startValue: 0, increments: 5, expected: 5, episodeCount: 5, expectHalt: true },
  { startValue: 0, increments: 10, expected: 10, episodeCount: 10, expectHalt: true },
  { startValue: 0, increments: 20, expected: 20, episodeCount: 20, expectHalt: true },
]

function runCase(testCase: CognitiveCase): void {
  const runtime = new AZCognitiveRuntimeAssembly()
  const symbols = runtime.symbolManager

  const topCreator = new AZTopContextCreator(
    runtime.symbolManager,
    runtime.predefinedSymbols,
    runtime.workingMemory,
    runtime.contextStack,
    runtime.stateStack,
    runtime.decisionRuntime.goalContextInitializer,
    runtime.structuralRegistry,
  )

  const rootGoal = topCreator.create().goal

  const eq = (referent: AZSymbol): AZProductionTest => ({
    type: 'EQUALITY',
    referent,
  })

  const stateIdTest = (variable: AZSymbol): AZProductionTest => ({
    type: 'CONJUNCTIVE',
    conjuncts: [
      eq(variable),
      { type: 'GOAL_ID' },
    ],
  })

  const positive = (
    identifier: AZSymbol,
    attribute: AZSymbol,
    value: AZSymbol,
    valueTest?: AZProductionTest,
  ): AZProductionCondition => ({
    type: 'POSITIVE',
    identifierTest: eq(identifier),
    attributeTest: eq(attribute),
    valueTest: valueTest ?? eq(value),
    acceptable: false,
  })

  const statePositive = (
    identifier: AZSymbol,
    attribute: AZSymbol,
    value: AZSymbol,
    valueTest?: AZProductionTest,
  ): AZProductionCondition => ({
    type: 'POSITIVE',
    identifierTest: stateIdTest(identifier),
    attributeTest: eq(attribute),
    valueTest: valueTest ?? eq(value),
    acceptable: false,
  })

  const rhs = (symbol: AZSymbol): AZProductionRhsValue => ({
    type: 'SYMBOL',
    symbol,
  })

  const o = (index: number): AZProductionRhsValue => ({
    type: 'UNBOUND_VARIABLE',
    index,
  })

  const make = (
    preferenceType: 'ACCEPTABLE' | 'UNARY_INDIFFERENT' | 'REJECT',
    identifier: AZProductionRhsValue,
    attribute: AZProductionRhsValue,
    value: AZProductionRhsValue,
  ) => ({
    type: 'MAKE' as const,
    preferenceType,
    identifier,
    attribute,
    value,
    support: 'UNKNOWN' as const,
  })

  const s = symbols.makeVariable('s')
  const op = symbols.makeVariable('op')
  const ct = symbols.makeVariable('ct')
  const max = symbols.makeVariable('max')

  const count = symbols.makeStringConstant('count')
  const maxAttribute = symbols.makeStringConstant('max')
  const name = symbols.makeStringConstant('name')
  const parametric = symbols.makeStringConstant('parametric-cognitive')
  const inc = symbols.makeStringConstant('inc')
  const init = symbols.makeStringConstant('init')
  const startValue = symbols.makeIntegerConstant(testCase.startValue)
  const plus = symbols.makeStringConstant('+')
  const halt = symbols.makeStringConstant('halt')
  const integer1 = symbols.makeIntegerConstant(1)
  const processedAttribute = symbols.makeStringConstant('processed')
  const yes = symbols.makeStringConstant('yes')
  const episodeAttribute = symbols.makeStringConstant('episode')
  const episodeIdAttribute = symbols.makeStringConstant('episode-id')
  const actionAttribute = symbols.makeStringConstant('action')
  const outcomeAttribute = symbols.makeStringConstant('outcome')
  const avancer = symbols.makeStringConstant('avancer')
  const succes = symbols.makeStringConstant('succes')
  const episodeVariable = symbols.makeVariable('episode')
  const episodeIdVariable = symbols.makeVariable('episode-id')
  const episodeIds = Array.from({ length: testCase.episodeCount }, (_, i) => symbols.makeStringConstant(`E${i + 1}`))
  const operatorAttribute = runtime.predefinedSymbols.operator

  const makeOperatorProposal = (
    state: AZSymbol,
    operatorName: AZSymbol,
  ): readonly ReturnType<typeof make>[] => [
    make('ACCEPTABLE', rhs(state), rhs(operatorAttribute), o(0)),
    make('UNARY_INDIFFERENT', rhs(state), rhs(operatorAttribute), o(0)),
    make('ACCEPTABLE', o(0), rhs(name), rhs(operatorName)),
  ]

  runtime.workingMemory.scheduleAdd(
    runtime.workingMemory.createElement(
      rootGoal,
      name,
      parametric,
      false,
    ),
  )

runtime.workingMemory.scheduleAdd(
    runtime.workingMemory.createElement(
      rootGoal,
      maxAttribute,
      symbols.makeIntegerConstant(testCase.expected),
      false,
    ),
  )

  for (const episodeId of episodeIds.slice(0, testCase.episodeCount)) {
    const episode = symbols.makeIdentifier('E')
    runtime.identifierStateRegistry.register(episode)

    for (const [identifier, attribute, value] of [
      [rootGoal, episodeAttribute, episode],
      [episode, episodeIdAttribute, episodeId],
      [episode, actionAttribute, avancer],
      [episode, outcomeAttribute, succes],
    ] as const) {
      runtime.workingMemory.scheduleAdd(
        runtime.workingMemory.createElement(
          identifier,
          attribute,
          value,
          false,
        ),
      )
    }
  }
  runtime.workingMemory.applyBufferedChanges()
  console.log(
    'Episodes presents dans AZ :',
    runtime.workingMemory.getElements()
      .filter(wme => wme.attribute === episodeIdAttribute)
      .map(wme => wme.value.value),
  )

  const productions: AZProductionDescriptor[] = [
    {
      name: 'parametric*propose*init',
      declaredSupport: 'UNDECLARED',
      conditions: [
        statePositive(s, name, parametric),
        {
          type: 'NEGATIVE',
          identifierTest: stateIdTest(s),
          attributeTest: eq(count),
          valueTest: eq(symbols.makeVariable('any-count')),
          acceptable: false,
        },
      ],
      actions: [
        ...makeOperatorProposal(s, init),
      ],
    },
    {
      name: 'parametric*apply*init',
      declaredSupport: 'UNDECLARED',
      conditions: [
        statePositive(s, operatorAttribute, op),
        positive(op, name, init),
      ],
      actions: [
        make(
          'ACCEPTABLE',
          rhs(s),
          rhs(count),
          rhs(startValue),
        ),
      ],
    },    {
      name: 'episodic*propose*inc*generic',
      declaredSupport: 'UNDECLARED',
      conditions: [
        statePositive(s, count, ct),
        statePositive(s, episodeAttribute, episodeVariable),
        positive(episodeVariable, episodeIdAttribute, episodeIdVariable),
        positive(episodeVariable, actionAttribute, avancer),
        positive(episodeVariable, outcomeAttribute, succes),
        {
          type: 'NEGATIVE',
          identifierTest: eq(episodeVariable),
          attributeTest: eq(processedAttribute),
          valueTest: eq(yes),
          acceptable: false,
        },
      ],
      actions: [
        ...makeOperatorProposal(s, inc),
        make('ACCEPTABLE', o(0), rhs(episodeAttribute), rhs(episodeVariable)),
      ],
    },
    {
      name: 'episodic*apply*inc*generic',
      declaredSupport: 'O_SUPPORT',
      conditions: [
        statePositive(s, operatorAttribute, op),
        positive(op, name, inc),
        positive(op, episodeAttribute, episodeVariable),
        statePositive(s, count, ct),
        statePositive(s, episodeAttribute, episodeVariable),
        positive(episodeVariable, episodeIdAttribute, episodeIdVariable),
        positive(episodeVariable, actionAttribute, avancer),
        positive(episodeVariable, outcomeAttribute, succes),
        {
          type: 'NEGATIVE',
          identifierTest: eq(episodeVariable),
          attributeTest: eq(processedAttribute),
          valueTest: eq(yes),
          acceptable: false,
        },
      ],
      actions: [
        make('REJECT', rhs(s), rhs(count), rhs(ct)),
        make('ACCEPTABLE', rhs(episodeVariable), rhs(processedAttribute), rhs(yes)),
        make('ACCEPTABLE', rhs(s), rhs(count), {
          type: 'FUNCALL',
          functionName: plus,
          arguments: [rhs(ct), rhs(integer1)],
        }),
      ],
    },
    {
      name: 'parametric*halt',
      declaredSupport: 'UNDECLARED',
      conditions: [
        statePositive(s, count, ct),
        positive(s, maxAttribute, ct),
      ],
      actions: [
        {
          type: 'FUNCALL',
          functionCall: {
            type: 'FUNCALL',
            functionName: halt,
            arguments: [],
          },
        },
      ],
    },
  ]

  for (const production of productions) {
    runtime.productionRuntime.productionInstaller.install(
      runtime.productionRuntime.productionMaterializer.materialize(
        production,
      ),
    )
  }

  const originalScheduleRemove =
    runtime.workingMemory.scheduleRemove.bind(runtime.workingMemory)

  const removalCounts = new Map<number, number>()

  runtime.workingMemory.scheduleRemove = element => {
    const previous = removalCounts.get(element.timetag) ?? 0
    removalCounts.set(element.timetag, previous + 1)

    if (testCase.episodeCount === 5 &&
        element.identifier.type === 'IDENTIFIER' &&
        element.value.type === 'IDENTIFIER') {
      console.log('B3-C4 REMOVE LINK', JSON.stringify({
        timetag: element.timetag,
        from: String(element.identifier.value),
        to: String(element.value.value),
        occurrence: previous + 1,
        phase: executedPhases,
      }))
    }

    if (testCase.episodeCount === 5 &&
        previous === 1 &&
        element.identifier.type === 'IDENTIFIER' &&
        element.value.type === 'IDENTIFIER') {
      console.log('B3-C4 DOUBLE REMOVE STACK', JSON.stringify({
        phase: executedPhases,
        timetag: element.timetag,
        stack: new Error().stack,
      }))
    }
    if (testCase.episodeCount === 5 &&
        element.timetag === 42) {
      console.log('B3-C4 TIMETAG42', JSON.stringify({
        phase: executedPhases,
        occurrence: previous + 1,
        stack: new Error().stack,
      }))
    }
    originalScheduleRemove(element)
  }
  let executedPhases = 0

  while (
    executedPhases < 500 &&
    !runtime.runControl.isHalted()
  ) {
    runtime.phaseRuntime.phaseExecutor.executeOnePhase()
    executedPhases += 1
    if (testCase.episodeCount === 5 &&
        [25, 26, 27, 28, 29, 30, 31, 32].includes(executedPhases)) {
      const elements = runtime.workingMemory.getElements()
      const links = elements.filter(wme =>
        wme.identifier === rootGoal &&
        wme.attribute === episodeAttribute
      )

      console.log('B3-C4 LINK COUNTS', JSON.stringify({
        phase: executedPhases,
        episodes: links.map(link => {
          const state = runtime.identifierStateRegistry.get(link.value)
          return {
            internal: String(link.value.value),
            realIncomingLinks: elements.filter(wme =>
              wme.value === link.value &&
              wme.identifier.type === 'IDENTIFIER'
            ).length,
            linkCount: state.linkCount,
            level: state.level,
            attributes: elements.filter(wme =>
              wme.identifier === link.value
            ).length,
          }
        }),
      }))
      console.log('B3-C4 PHASE SNAPSHOT', JSON.stringify({
        phase: executedPhases,
        episodes: links.map(link => {
          const children = elements.filter(wme =>
            wme.identifier === link.value
          )
          return {
            internal: String(link.value.value),
            attributes: children.map(child => ({
              attribute: String(child.attribute.value),
              value: String(child.value.value),
            })),
          }
        }),
      }))
    }

    const currentCounts = runtime.workingMemory.getElements()
      .filter(wme => wme.identifier === rootGoal && wme.attribute === count)
      .map(wme => wme.value.value)

    const selectedOperators = runtime.workingMemory.getElements()
      .filter(wme =>
        wme.identifier === rootGoal &&
        wme.attribute === operatorAttribute
      )
      .map(wme => String(wme.value.value ?? wme.value.type))

    console.log(
      'TRACE B3-C4',
      'phase=', executedPhases,
      'count=', currentCounts,
      'operators=', selectedOperators,
    )
  }
  if (testCase.episodeCount === 5) {
    const elements = runtime.workingMemory.getElements()
    const identities = elements.filter(wme => wme.attribute === episodeIdAttribute)
    const marks = elements.filter(wme =>
      wme.attribute === processedAttribute && wme.value === yes
    )

    console.log('B3-C4 LINKS',
      elements.filter(wme =>
        wme.identifier === rootGoal &&
        wme.attribute === episodeAttribute
      ).map(wme => ({
        episode: String(wme.value.value),
        attributes: elements
          .filter(child => child.identifier === wme.value)
          .map(child => ({
            attribute: String(child.attribute.value),
            value: String(child.value.value),
          })),
      }))
    )
    console.log('B3-C4 DIAGNOSTIC FINAL', {
      phase: executedPhases,
      count: elements
        .filter(wme => wme.identifier === rootGoal && wme.attribute === count)
        .map(wme => wme.value.value),
      episodes: identities.map(wme => ({
        id: String(wme.value.value),
        processed: marks.some(mark => mark.identifier === wme.identifier),
      })),
      processedMarks: marks.length,
    })
  }
  assert.equal(
    runtime.runControl.isHalted(),
    testCase.expectHalt,
    'AZ parametric cognitive execution must terminate autonomously',
  )

  if (!testCase.expectHalt) {
    assert.equal(
      executedPhases,
      100,
      'AZ must complete the stability observation window',
    )

    const remainingOperators = runtime.workingMemory.getElements()
      .filter(wme =>
        wme.identifier === rootGoal &&
        wme.attribute === operatorAttribute
      )

    assert.equal(
      remainingOperators.length,
      0,
      'No operator should remain selected after episode processing',
    )
  }
  let enableReinsertionDiagnostic = false
  if (enableReinsertionDiagnostic && testCase.episodeCount === 2) {
    const wm = runtime.workingMemory

    const episodeLinks = wm.getElements().filter(wme =>
      wme.identifier === rootGoal &&
      wme.attribute === episodeAttribute
    )

    assert.equal(episodeLinks.length, 2)

    const originalLink = episodeLinks.find(link =>
      wm.getElements().some(wme =>
        wme.identifier === link.value &&
        wme.attribute === episodeIdAttribute &&
        wme.value === episodeIds[0]
      )
    )

    if (originalLink === undefined) {
      throw new Error('E1 must exist before reinsertion')
    }

    const verifiedOriginalLink = originalLink

    assert.ok(
      wm.getElements().some(wme =>
        wme.identifier === verifiedOriginalLink.value &&
        wme.attribute === processedAttribute &&
        wme.value === yes
      ),
      'E1 must already be processed'
    )

    wm.scheduleRemove(verifiedOriginalLink)
    wm.applyBufferedChanges()

    wm.scheduleAdd(
      wm.createElement(
        rootGoal,
        episodeAttribute,
        verifiedOriginalLink.value,
        false
      )
    )
    wm.applyBufferedChanges()

    for (let phase = 0; phase < 30; phase += 1) {
      assert.equal(runtime.runControl.isHalted(), false)
      runtime.phaseRuntime.phaseExecutor.executeOnePhase()
    }

    const countsAfterReinsertion = wm.getElements().filter(wme =>
      wme.identifier === rootGoal &&
      wme.attribute === count
    )

    assert.equal(countsAfterReinsertion.length, 1)
    assert.equal(
      countsAfterReinsertion[0]?.value.value,
      2,
      'Already processed E1 must not increment the counter again'
    )

    console.log('B3-C3 REINSERTION E1 : compteur stable a 2 : AZ OK')
  }
  const processedWmes = runtime.workingMemory.getElements()
    .filter(wme =>
      wme.attribute === processedAttribute &&
      wme.value === yes
    )

  const episodeIdentities = runtime.workingMemory.getElements()
    .filter(wme => wme.attribute === episodeIdAttribute)

  console.log(
    'B3-C3 episode identities:',
    episodeIdentities.map(wme => ({
      internal: String(wme.identifier.value),
      businessId: String(wme.value.value),
      processed: processedWmes.some(mark => mark.identifier === wme.identifier),
    })),
  )
  console.log(
    'B3-C3 processed marks:',
    processedWmes.map(wme => ({
      episode: String(wme.identifier.value),
      value: String(wme.value.value),
    })),
  )

  assert.equal(
    processedWmes.length,
    testCase.episodeCount,
    'AZ must retain exactly one processed mark per episode',
  )

  assert.equal(
    new Set(processedWmes.map(wme => wme.identifier)).size,
    testCase.episodeCount,
    'Each processed mark must belong to a distinct episode',
  )
  const countWmes = runtime.workingMemory
    .getElements()
    .filter(
      wme =>
        wme.identifier === rootGoal &&
        wme.attribute === count,
    )
  assert.equal(
    countWmes.length,
    1,
    'AZ must retain exactly one current count value',
  )

  assert.equal(
    countWmes[0]?.value.type,
    'INTEGER_CONSTANT',
  )

  assert.equal(
    countWmes[0]?.value.value,
    testCase.expected,
  )

  assert.equal(
    testCase.startValue + testCase.increments,
    testCase.expected,
  )

  console.log(
    `${testCase.startValue} + ${testCase.increments} increments = ${countWmes[0]?.value.value} : AZ OK`,
  )
}

for (const testCase of cases) {
  runCase(testCase)
}

console.log('AZ parametric cognitive benchmark: OK')
