import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZDefaultCandidateSelectionPolicy } from '../../src/engines/cognitive/az/core/decision/AZDefaultCandidateSelectionPolicy'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import type { AZProductionRhsValue } from '../../src/engines/cognitive/az/core/production/AZProductionRhsValue'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { ControlledRandomSequence } from '../../src/engines/cognitive/az/monitoring/ControlledRandomSequence'
import { PERSISTENT_PRESCRIPTION_RANDOM_SEQUENCES } from './az-persistent-prescription-random-sequences'
import { AZWorkingMemoryStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZWorkingMemoryStructuralStateExtractor'
import { AZMatchSetStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZMatchSetStructuralStateExtractor'

interface SymmetricAction {
  readonly name: 'A' | 'B'
}

interface SymmetricState {
  readonly position: number
}

interface SymmetricTrace {
  readonly actions: readonly SymmetricAction['name'][]
  readonly positions: readonly number[]
  readonly success: boolean
}

const L = 6

const actions: readonly SymmetricAction[] = [
  { name: 'A' },
  { name: 'B' },
]

const initialState = (): SymmetricState => ({
  position: 0,
})

const availableActions = (
  state: SymmetricState,
): readonly SymmetricAction[] =>
  state.position < L
    ? actions
    : []

const applyAction = (
  state: SymmetricState,
  action: SymmetricAction,
): SymmetricState => {
  assert.ok(
    availableActions(state).some(
      candidate =>
        candidate.name === action.name,
    ),
    `action ${action.name} must be available`,
  )

  return {
    position: state.position + 1,
  }
}

const isSuccess = (
  state: SymmetricState,
): boolean =>
  state.position === L

const runSequence = (
  sequence: readonly SymmetricAction['name'][],
): SymmetricTrace => {
  let state = initialState()

  const positions = [state.position]

  for (const name of sequence) {
    const action = actions.find(
      candidate =>
        candidate.name === name,
    )

    assert.notEqual(
      action,
      undefined,
      `action ${name} must exist`,
    )

    if (action === undefined) {
      throw new Error(
        `Unknown symmetric action: ${name}`,
      )
    }

    state = applyAction(
      state,
      action,
    )

    positions.push(
      state.position,
    )
  }

  return {
    actions: [...sequence],
    positions,
    success: isSuccess(state),
  }
}

const swapAction = (
  action: SymmetricAction['name'],
): SymmetricAction['name'] =>
  action === 'A'
    ? 'B'
    : 'A'

const swapSequence = (
  sequence: readonly SymmetricAction['name'][],
): readonly SymmetricAction['name'][] =>
  sequence.map(swapAction)

const enumerateSequences = (
  length: number,
): readonly (
  readonly SymmetricAction['name'][]
)[] => {
  if (length === 0) {
    return [[]]
  }

  const previous =
    enumerateSequences(length - 1)

  return previous.flatMap(
    sequence => [
      [...sequence, 'A' as const],
      [...sequence, 'B' as const],
    ],
  )
}

/*
 * Qualification 1:
 * A and B must have exactly the same
 * state transition.
 */
for (
  let position = 0;
  position < L;
  position += 1
) {
  const state = { position }

  const afterA =
    applyAction(
      state,
      actions[0]!,
    )

  const afterB =
    applyAction(
      state,
      actions[1]!,
    )

  assert.deepEqual(
    afterA,
    afterB,
    `A and B must be structurally equivalent at position ${position}`,
  )

  assert.equal(
    afterA.position,
    position + 1,
  )
}

/*
 * Qualification 2:
 * availability must be symmetric.
 */
for (
  let position = 0;
  position <= L;
  position += 1
) {
  const available =
    availableActions({
      position,
    }).map(
      action =>
        action.name,
    )

  if (position < L) {
    assert.deepEqual(
      available,
      ['A', 'B'],
      `both actions must be available at position ${position}`,
    )
  } else {
    assert.deepEqual(
      available,
      [],
      'no action must remain after success',
    )
  }
}

/*
 * Qualification 3:
 * every length-L sequence succeeds.
 *
 * With L=6 there are exactly 2^6=64
 * possible A/B trajectories.
 */
const completeSequences =
  enumerateSequences(L)

assert.equal(
  completeSequences.length,
  2 ** L,
  'benchmark must expose every A/B trajectory',
)

for (const sequence of completeSequences) {
  const trace =
    runSequence(sequence)

  assert.equal(
    trace.success,
    true,
    `every length-${L} trajectory must succeed`,
  )

  assert.deepEqual(
    trace.positions,
    [0, 1, 2, 3, 4, 5, 6],
    'every complete trajectory must have the same structural progression',
  )
}

/*
 * Qualification 4:
 * metamorphic A <-> B symmetry.
 */
for (const sequence of completeSequences) {
  const original =
    runSequence(sequence)

  const swapped =
    runSequence(
      swapSequence(sequence),
    )

  assert.equal(
    original.success,
    swapped.success,
    'A/B label swapping must preserve success',
  )

  assert.deepEqual(
    original.positions,
    swapped.positions,
    'A/B label swapping must preserve the complete position trajectory',
  )

  assert.equal(
    original.actions.length,
    swapped.actions.length,
    'A/B label swapping must preserve trajectory length',
  )
}

/*
 * Qualification 5:
 * incompatible continuations remain
 * successful.
 *
 * This establishes the structural basis
 * required for TaskNonNec.
 */
const allA =
  runSequence(
    Array.from(
      { length: L },
      () => 'A' as const,
    ),
  )

const allB =
  runSequence(
    Array.from(
      { length: L },
      () => 'B' as const,
    ),
  )

assert.equal(
  allA.success,
  true,
)

assert.equal(
  allB.success,
  true,
)

assert.deepEqual(
  allA.positions,
  allB.positions,
)

console.log(
  `AZ persistent-prescription symmetric benchmark qualification: OK (${completeSequences.length} trajectories)`,
)


/*
 * Runtime qualification.
 *
 * This section does not test G, CE or CP.
 * It qualifies the frozen symmetric task through
 * the real AZ cognitive cycle.
 */

const createSymmetricRuntime = (
  sequence: readonly number[],
) => {
  const random =
    new ControlledRandomSequence(sequence)

  const selectionPolicy =
    new AZDefaultCandidateSelectionPolicy(
      () => random.next(),
    )

  const runtime =
    new AZCognitiveRuntimeAssembly(
      undefined,
      undefined,
      selectionPolicy,
    )

  const symbols =
    runtime.symbolManager

  const topCreator =
    new AZTopContextCreator(
      runtime.symbolManager,
      runtime.predefinedSymbols,
      runtime.workingMemory,
      runtime.contextStack,
      runtime.stateStack,
      runtime.decisionRuntime.goalContextInitializer,
      runtime.structuralRegistry,
    )

  const topContext =
    topCreator.create()

  const rootGoal =
    topContext.goal

  const eq = (
    referent: AZSymbol,
  ): AZProductionTest => ({
    type: 'EQUALITY',
    referent,
  })

  const stateIdTest = (
    variable: AZSymbol,
  ): AZProductionTest => ({
    type: 'CONJUNCTIVE',
    conjuncts: [
      eq(variable),
      {
        type: 'GOAL_ID',
      },
    ],
  })

  const statePositive = (
    variable: AZSymbol,
    attribute: AZSymbol,
    value: AZSymbol,
    valueTest?: AZProductionTest,
  ): AZProductionCondition => ({
    type: 'POSITIVE',
    identifierTest: stateIdTest(variable),
    attributeTest: eq(attribute),
    valueTest:
      valueTest ?? eq(value),
    acceptable: false,
  })

  const positive = (
    identifier: AZSymbol,
    attribute: AZSymbol,
    value: AZSymbol,
  ): AZProductionCondition => ({
    type: 'POSITIVE',
    identifierTest: eq(identifier),
    attributeTest: eq(attribute),
    valueTest: eq(value),
    acceptable: false,
  })

  const negative = (
    identifier: AZSymbol,
    attribute: AZSymbol,
    value: AZSymbol,
  ): AZProductionCondition => ({
    type: 'NEGATIVE',
    identifierTest: eq(identifier),
    attributeTest: eq(attribute),
    valueTest: eq(value),
    acceptable: false,
  })

  const rhs = (
    symbol: AZSymbol,
  ): AZProductionRhsValue => ({
    type: 'SYMBOL',
    symbol,
  })

  const unbound = (
    index: number,
  ): AZProductionRhsValue => ({
    type: 'UNBOUND_VARIABLE',
    index,
  })

  const make = (
    preferenceType:
      | 'ACCEPTABLE'
      | 'UNARY_INDIFFERENT'
      | 'REJECT',
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

  const s =
    symbols.makeVariable('s')

  const op =
    symbols.makeVariable('op')

  const p =
    symbols.makeVariable('p')

  const anyPosition =
    symbols.makeVariable('any-position')

  const position =
    symbols.makeStringConstant('position')

  const name =
    symbols.makeStringConstant('name')

  const initialize =
    symbols.makeStringConstant(
      'initialize-persistent-prescription-benchmark',
    )

  const actionA =
    symbols.makeStringConstant('A')

  const actionB =
    symbols.makeStringConstant('B')

  const integer0 =
    symbols.makeIntegerConstant(0)

  const integer1 =
    symbols.makeIntegerConstant(1)

  const integerL =
    symbols.makeIntegerConstant(L)

  const plus =
    symbols.makeStringConstant('+')

  const operator =
    runtime.predefinedSymbols.operator

  const makeABProposal = (
    operatorName: AZSymbol,
  ): readonly ReturnType<typeof make>[] => [
    make(
      'ACCEPTABLE',
      rhs(s),
      rhs(operator),
      unbound(0),
    ),
    make(
      'UNARY_INDIFFERENT',
      rhs(s),
      rhs(operator),
      unbound(0),
    ),
    make(
      'ACCEPTABLE',
      unbound(0),
      rhs(name),
      rhs(operatorName),
    ),
  ]

  const makeProposal = (
    productionName: string,
    operatorName: AZSymbol,
  ): AZProductionDescriptor => ({
    name: productionName,
    declaredSupport: 'UNDECLARED',
    conditions: [
      statePositive(
        s,
        position,
        p,
        {
          type: 'CONJUNCTIVE',
          conjuncts: [
            eq(p),
            {
              type: 'LESS',
              referent: integerL,
            },
          ],
        },
      ),
    ],
    actions: [
      ...makeABProposal(
        operatorName,
      ),
    ],
  })

  const makeApplication = (
    productionName: string,
    operatorName: AZSymbol,
  ): AZProductionDescriptor => ({
    name: productionName,
    declaredSupport: 'UNDECLARED',
    conditions: [
      statePositive(
        s,
        operator,
        op,
      ),
      positive(
        op,
        name,
        operatorName,
      ),
      positive(
        s,
        position,
        p,
      ),
    ],
    actions: [
      make(
        'REJECT',
        rhs(s),
        rhs(position),
        rhs(p),
      ),
      make(
        'ACCEPTABLE',
        rhs(s),
        rhs(position),
        {
          type: 'FUNCALL',
          functionName: plus,
          arguments: [
            rhs(p),
            rhs(integer1),
          ],
        },
      ),
    ],
  })

  const productions:
    AZProductionDescriptor[] = [
      {
        name:
          'persistent-prescription*propose*initialize',
        declaredSupport: 'UNDECLARED',
        conditions: [
          statePositive(
            s,
            runtime.predefinedSymbols.superstate,
            runtime.predefinedSymbols.nil,
          ),
          negative(
            s,
            position,
            anyPosition,
          ),
        ],
        actions: [
          make(
            'ACCEPTABLE',
            rhs(s),
            rhs(operator),
            unbound(0),
          ),
          make(
            'ACCEPTABLE',
            unbound(0),
            rhs(name),
            rhs(initialize),
          ),
        ],
      },

      {
        name:
          'persistent-prescription*apply*initialize',
        declaredSupport: 'UNDECLARED',
        conditions: [
          statePositive(
            s,
            operator,
            op,
          ),
          positive(
            op,
            name,
            initialize,
          ),
        ],
        actions: [
          make(
            'ACCEPTABLE',
            rhs(s),
            rhs(position),
            rhs(integer0),
          ),
        ],
      },

      makeProposal(
        'persistent-prescription*propose*A',
        actionA,
      ),

      makeProposal(
        'persistent-prescription*propose*B',
        actionB,
      ),

      makeApplication(
        'persistent-prescription*apply*A',
        actionA,
      ),

      makeApplication(
        'persistent-prescription*apply*B',
        actionB,
      ),
    ]

  for (const descriptor of productions) {
    const production =
      runtime
        .productionRuntime
        .productionMaterializer
        .materialize(descriptor)

    assert.equal(
      runtime
        .productionRuntime
        .productionInstaller
        .install(production),
      'NO_REFRACTED_INSTANTIATION',
    )
  }

  return {
    random,
    runtime,
    rootGoal,
    position,
    operator,
  }
}

const qualificationSequence =
  Array.from(
    { length: 64 },
    (_, index) =>
      index % 2 === 0
        ? 0.25
        : 0.75,
  )

interface GenerationObservation {
  readonly opportunity: number
  readonly position: number
  readonly workingMemory: ReturnType<
    AZWorkingMemoryStructuralStateExtractor['extract']
  >
  readonly matchSet: ReturnType<
    AZMatchSetStructuralStateExtractor['extract']
  >
}

interface GenerationTrialTrace {
  readonly qPositions: readonly number[]
  readonly decisions: number
  readonly randomCalls: number
  readonly finalPosition: number
  readonly reachedSuccess: boolean
  readonly observations:
    readonly GenerationObservation[]
}

const runGenerationTrial = (
  sequence: readonly number[],
): GenerationTrialTrace => {
  const trial =
    createSymmetricRuntime(sequence)

  const {
    random,
    runtime,
    rootGoal,
    position,
    operator,
  } = trial

  const qPositions: number[] = []
  let decisions = 0
  let previousWasABQ = false
  let reachedSuccess = false
  let randomAtFirstQ: number | null = null
  let finalPosition = 0

  const workingMemoryExtractor =
    new AZWorkingMemoryStructuralStateExtractor()

  const matchSetExtractor =
    new AZMatchSetStructuralStateExtractor()

  const observations:
    GenerationObservation[] = []

  for (
    let phaseIndex = 0;
    phaseIndex < 160;
    phaseIndex += 1
  ) {
    const result =
      runtime
        .phaseRuntime
        .phaseExecutor
        .executeOnePhase()

    if (
      result.executedPhase === 'DECIDE' &&
      previousWasABQ
    ) {
      decisions += 1
    }

    previousWasABQ = false

    const currentPositions =
      runtime
        .workingMemory
        .getElements()
        .filter(
          wme =>
            wme.identifier === rootGoal &&
            wme.attribute === position &&
            wme.acceptable === false,
        )
        .map(
          wme =>
            Number(wme.value.value),
        )

    assert.ok(
      currentPositions.length <= 1,
      'generation runner must never expose multiple current positions',
    )

    if (currentPositions.length === 1) {
      finalPosition =
        currentPositions[0]!
    }

    if (
      currentPositions.length === 1 &&
      currentPositions[0] === L
    ) {
      reachedSuccess = true
      break
    }

    if (
      result.executedPhase !== 'PROPOSE' ||
      result.nextPhase !== 'DECIDE' ||
      currentPositions.length !== 1
    ) {
      continue
    }

    const operatorSlot =
      runtime
        .preferenceMemory
        .getSlot(
          rootGoal,
          operator,
        )

    const acceptable =
      operatorSlot
        ?.preferencesByType
        .get('ACCEPTABLE') ?? []

    const indifferent =
      operatorSlot
        ?.preferencesByType
        .get('UNARY_INDIFFERENT') ?? []

    if (
      acceptable.length !== 2 ||
      indifferent.length !== 2
    ) {
      continue
    }

    if (randomAtFirstQ === null) {
      randomAtFirstQ =
        random.currentIndex()
    }

    qPositions.push(
      currentPositions[0]!,
    )

    if (qPositions.length <= 3) {
      observations.push({
        opportunity: qPositions.length,
        position: currentPositions[0]!,
        workingMemory:
          workingMemoryExtractor.extract(
            runtime.workingMemory,
          ),
        matchSet:
          matchSetExtractor.extract(
            runtime
              .productionRuntime
              .matchSet,
          ),
      })
    }

    previousWasABQ = true
  }

  const randomCalls =
    random.currentIndex() -
    (randomAtFirstQ ?? 0)

  return {
    qPositions,
    decisions,
    randomCalls,
    finalPosition,
    reachedSuccess,
    observations,
  }
}

/*
 * Pre-experimental runner qualification.
 *
 * This deliberately uses the non-scientific
 * qualification sequence. The 12 frozen
 * experimental sequences are not consumed here.
 *
 * This section does not test G, CE or CP.
 */
const qualificationTrace =
  runGenerationTrial(
    qualificationSequence,
  )

assert.deepEqual(
  qualificationTrace.observations.map(
    observation => ({
      opportunity: observation.opportunity,
      position: observation.position,
    }),
  ),
  [
    { opportunity: 1, position: 0 },
    { opportunity: 2, position: 1 },
    { opportunity: 3, position: 2 },
  ],
  'generation window must contain exactly the first three qualified A/B opportunities',
)

assert.equal(
  qualificationTrace.observations.length,
  3,
  'generation window must contain exactly three passive structural observations',
)

assert.equal(
  qualificationTrace.reachedSuccess,
  true,
  'runtime qualification must reach position L',
)

assert.deepEqual(
  qualificationTrace.qPositions,
  [0, 1, 2, 3, 4, 5],
  'runtime must expose exactly six natural symmetric A/B opportunities',
)

assert.equal(
  qualificationTrace.decisions,
  L,
  'runtime must execute exactly six A/B decisions',
)

assert.equal(
  qualificationTrace.randomCalls,
  11,
  'qualification stochastic consumption must remain exactly R=11',
)

assert.equal(
  qualificationTrace.finalPosition,
  L,
  'runtime qualification must finish at position L',
)

console.log(
  'AZ persistent-prescription generation runner qualification: OK',
  JSON.stringify({
    Q: qualificationTrace.qPositions,
    D: qualificationTrace.decisions,
    R: qualificationTrace.randomCalls,
    finalPosition:
      qualificationTrace.finalPosition,
    observations:
      qualificationTrace.observations.map(
        observation => ({
          opportunity:
            observation.opportunity,
          position:
            observation.position,
        }),
      ),
  }),
)
/*
 * Scientific G experiment entry point.
 *
 * IMPORTANT:
 * - inactive during ordinary qualification;
 * - consumes the 12 frozen sequences only when explicitly enabled;
 * - one fresh AZ runtime per sequence through runGenerationTrial;
 * - preserves raw structural observations;
 * - does not classify PA and does not decide G, CE or CP.
 */
if (
  process.env
    .AZ_RUN_PERSISTENT_PRESCRIPTION_G === '1'
) {
  assert.equal(
    PERSISTENT_PRESCRIPTION_RANDOM_SEQUENCES.length,
    12,
    'frozen G experiment must contain exactly N=12 sequences',
  )

  const scientificGenerationTraces =
    PERSISTENT_PRESCRIPTION_RANDOM_SEQUENCES.map(
      (sequence, index) => ({
        trial: index + 1,
        trace: runGenerationTrial(sequence),
      }),
    )

  for (
    const {
      trial,
      trace,
    } of scientificGenerationTraces
  ) {
    assert.equal(
      trace.reachedSuccess,
      true,
      `G trial ${trial} must reach position L`,
    )

    assert.deepEqual(
      trace.qPositions,
      [0, 1, 2, 3, 4, 5],
      `G trial ${trial} must expose the six frozen symmetric opportunities`,
    )

    assert.equal(
      trace.decisions,
      L,
      `G trial ${trial} must execute exactly six A/B decisions`,
    )

    assert.equal(
      trace.observations.length,
      3,
      `G trial ${trial} must preserve exactly three generation-window observations`,
    )

    assert.deepEqual(
      trace.observations.map(
        observation => ({
          opportunity:
            observation.opportunity,
          position:
            observation.position,
        }),
      ),
      [
        { opportunity: 1, position: 0 },
        { opportunity: 2, position: 1 },
        { opportunity: 3, position: 2 },
      ],
      `G trial ${trial} must preserve the frozen generation window`,
    )
  }

  console.log(
    'AZ persistent-prescription scientific G raw traces:',
    JSON.stringify(
      scientificGenerationTraces,
      null,
      2,
    ),
  )
}
