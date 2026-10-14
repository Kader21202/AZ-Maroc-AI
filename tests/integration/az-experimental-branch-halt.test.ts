import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { ExperimentalBranchRunner } from '../../src/engines/cognitive/az/monitoring/ExperimentalBranchRunner'
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

let reachedQ = false
const preQTrace: string[] = []

for (let step = 0; step < 20; step += 1) {
  assert.equal(
    runtime.runControl.isHalted(),
    false,
    'terminal scenario must reach natural Q before halt',
  )

  const result =
    runtime.phaseRuntime
      .phaseExecutor
      .executeOnePhase()

  preQTrace.push(
    `${result.executedPhase}->${result.nextPhase}`,
  )

  if (
    result.executedPhase === 'PROPOSE' &&
    result.nextPhase === 'DECIDE'
  ) {
    reachedQ = true
    break
  }
}

assert.equal(
  reachedQ,
  true,
  `terminal scenario must expose natural Q before halt: ${preQTrace.join(' | ')}`,
)

assert.equal(
  runtime.runControl.isHalted(),
  false,
  'runtime must still be live at natural Q',
)

console.log(
  'AZ experimental branch halt natural Q:',
  preQTrace.join(' | '),
)


const branchRunner =
  new ExperimentalBranchRunner()

const branchResult = branchRunner.run({
  runtime,
  horizonCycles: 2,
  intervention: {
    apply: () => {},
  },
})

assert.equal(
  branchResult.stoppingReason,
  'HALTED',
  'AZ halt before the horizon must be reported as HALTED',
)

assert.equal(
  runtime.runControl.isHalted(),
  true,
  'AZ production must halt the runtime',
)

assert.equal(
  runtime.runControl.reasonForStopping(),
  'halt',
  'runner must preserve the AZ halt reason',
)

assert.equal(
  branchResult.observations.length > 0,
  true,
  'executed observations before halt must be preserved',
)

const completedCycles =
  branchResult.observations.filter(
    observation =>
      observation.phase.executedPhase === 'OUTPUT' &&
      observation.phase.nextPhase === 'INPUT',
  ).length

assert.equal(
  completedCycles,
  0,
  'halt must occur before any completed continuation cycle',
)

console.log(
  'AZ experimental branch halt: OK',
)
