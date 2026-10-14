import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'
import type { AZProductionRhsValue } from '../../src/engines/cognitive/az/core/production/AZProductionRhsValue'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

interface CognitiveCase {
  readonly startValue: number
  readonly increments: number
  readonly expected: number
}

const cases: readonly CognitiveCase[] = [
  { startValue: 3, increments: 2, expected: 5 },
  { startValue: 3, increments: 4, expected: 7 },
  { startValue: 10, increments: 4, expected: 14 },
  { startValue: 7, increments: 1, expected: 8 },
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

  runtime.workingMemory.applyBufferedChanges()

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
      name: 'parametric*propose*inc',
      declaredSupport: 'UNDECLARED',
      conditions: [
        statePositive(s, maxAttribute, max),
        positive(
          s,
          count,
          ct,
          {
            type: 'CONJUNCTIVE',
            conjuncts: [
              eq(ct),
              {
                type: 'LESS',
                referent: max,
              },
            ],
          },
        ),
      ],
      actions: [
        ...makeOperatorProposal(s, inc),
      ],
    },
    {
      name: 'parametric*apply*inc',
      declaredSupport: 'UNDECLARED',
      conditions: [
        statePositive(s, operatorAttribute, op),
        positive(s, count, ct),
        positive(op, name, inc),
      ],
      actions: [
        make(
          'REJECT',
          rhs(s),
          rhs(count),
          rhs(ct),
        ),
        make(
          'ACCEPTABLE',
          rhs(s),
          rhs(count),
          {
            type: 'FUNCALL',
            functionName: plus,
            arguments: [
              rhs(ct),
              rhs(integer1),
            ],
          },
        ),
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

  let executedPhases = 0

  while (
    executedPhases < 100 &&
    !runtime.runControl.isHalted()
  ) {
    runtime.phaseRuntime.phaseExecutor.executeOnePhase()
    executedPhases += 1
  }
  assert.equal(
    runtime.runControl.isHalted(),
    true,
    'AZ parametric cognitive execution must terminate autonomously',
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






