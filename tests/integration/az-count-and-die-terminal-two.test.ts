import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'
import type { AZProductionRhsValue } from '../../src/engines/cognitive/az/core/production/AZProductionRhsValue'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

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

const topContext = topCreator.create()
const rootGoal = topContext.goal

const eq = (referent: AZSymbol): AZProductionTest => ({
  type: 'EQUALITY',
  referent,
})

const stateIdTest = (
  variable: AZSymbol,
): AZProductionTest => ({
  type: 'CONJUNCTIVE',
  conjuncts: [
    eq(variable),
    { type: 'GOAL_ID' },
  ],
})

const statePositive = (
  variable: AZSymbol,
  attribute: AZSymbol,
  value: AZSymbol,
): AZProductionCondition => ({
  type: 'POSITIVE',
  identifierTest: stateIdTest(variable),
  attributeTest: eq(attribute),
  valueTest: eq(value),
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

const rhs = (
  symbol: AZSymbol,
): AZProductionRhsValue => ({
  type: 'SYMBOL',
  symbol,
})

const o = (
  index: number,
): AZProductionRhsValue => ({
  type: 'UNBOUND_VARIABLE',
  index,
})

const make = (
  preferenceType:
    | 'ACCEPTABLE'
    | 'UNARY_INDIFFERENT',
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

const name = symbols.makeStringConstant('name')
const phase = symbols.makeStringConstant('phase')
const countAndDie =
  symbols.makeStringConstant('count-and-die')
const two = symbols.makeStringConstant('two')
const halt = symbols.makeStringConstant('halt')

const operatorAttribute =
  runtime.predefinedSymbols.operator

const makeOperatorProposal = (
  state: AZSymbol,
  operatorName: AZSymbol,
) => [
  make(
    'ACCEPTABLE',
    rhs(state),
    rhs(operatorAttribute),
    o(0),
  ),
  make(
    'UNARY_INDIFFERENT',
    rhs(state),
    rhs(operatorAttribute),
    o(0),
  ),
  make(
    'ACCEPTABLE',
    o(0),
    rhs(name),
    rhs(operatorName),
  ),
]

const productions: AZProductionDescriptor[] = [
  {
    name: 'count-and-die*propose*two',
    declaredSupport: 'UNDECLARED',
    conditions: [
      statePositive(
        s,
        name,
        countAndDie,
      ),
      positive(
        s,
        phase,
        two,
      ),
    ],
    actions: [
      ...makeOperatorProposal(s, two),
    ],
  },
  {
    name: 'apply*two',
    declaredSupport: 'UNDECLARED',
    conditions: [
      statePositive(
        s,
        operatorAttribute,
        op,
      ),
      positive(
        op,
        name,
        two,
      ),
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
  runtime.productionRuntime
    .productionInstaller
    .install(
      runtime.productionRuntime
        .productionMaterializer
        .materialize(production),
    )
}

runtime.workingMemory.scheduleAdd(
  runtime.workingMemory.createElement(
    rootGoal,
    name,
    countAndDie,
    false,
  ),
)

runtime.workingMemory.scheduleAdd(
  runtime.workingMemory.createElement(
    rootGoal,
    phase,
    two,
    false,
  ),
)

runtime.workingMemory.applyBufferedChanges()

const trace: unknown[] = []

for (
  let step = 0;
  step < 20 && !runtime.runControl.isHalted();
  step += 1
) {
  const result =
    runtime.phaseRuntime
      .phaseExecutor
      .executeOnePhase()

  const rootWmes =
    runtime.workingMemory
      .getElements()
      .filter(wme => wme.identifier === rootGoal)

  const selectedOperators =
    rootWmes.filter(
      wme =>
        wme.attribute === operatorAttribute &&
        !wme.acceptable,
    )

  trace.push({
    step,
    executedPhase: result.executedPhase,
    nextPhase: result.nextPhase,
    halted: runtime.runControl.isHalted(),
    selectedOperators:
      selectedOperators.map(
        wme => wme.value.value,
      ),
    wmes: runtime.workingMemory
      .getElements()
      .map(wme => ({
        id: wme.identifier.value,
        attribute: wme.attribute.value,
        value: wme.value.value,
        acceptable: wme.acceptable,
      })),
  })
}

console.log(
  'AZ-TERMINAL-TWO-TRACE:',
  JSON.stringify(trace, null, 2),
)

assert.equal(
  runtime.runControl.isHalted(),
  true,
  'AZ terminal phase-two path must reach halt autonomously',
)

console.log(
  'AZ terminal phase-two path: OK',
)
