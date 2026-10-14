import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionTest } from '../../src/engines/cognitive/az/core/production/AZProductionTest'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const runtime = new AZCognitiveRuntimeAssembly()
const symbols = runtime.symbolManager

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

const top = topCreator.create()
const rootGoal = top.goal

const s = symbols.makeVariable('<s>')
const parent = symbols.makeVariable('<parent>')

const valueAttribute =
  symbols.makeStringConstant('value')

const fortyTwo =
  symbols.makeIntegerConstant(42)

const o1 =
  symbols.makeIdentifier('O')

const o2 =
  symbols.makeIdentifier('O')

const eq = (
  symbol: AZSymbol,
): AZProductionTest => ({
  type: 'EQUALITY',
  referent: symbol,
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

const proposal = (
  name: string,
  operator: AZSymbol,
): AZProduction => ({
  name,
  declaredSupport: 'UNDECLARED',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: stateIdTest(s),
      attributeTest: eq(valueAttribute),
      valueTest: eq(fortyTwo),
      acceptable: false,
    },
  ],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol: s,
      },
      attribute: {
        type: 'SYMBOL',
        symbol:
          runtime.predefinedSymbols.operator,
      },
      value: {
        type: 'SYMBOL',
        symbol: operator,
      },
      support: 'UNKNOWN',
    },
  ],
  instantiations: [],
})

const proposeO1 =
  proposal(
    'az-controlled-impasse-propose-o1',
    o1,
  )

const proposeO2 =
  proposal(
    'az-controlled-impasse-propose-o2',
    o2,
  )

const substate = symbols.makeVariable('<substate>')
const superstate = symbols.makeVariable('<superstate>')

const resolveTie: AZProduction = {
  name: 'az-controlled-impasse-resolve-tie',
  declaredSupport: 'I_SUPPORT',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: eq(substate),
      attributeTest: eq(
        runtime.predefinedSymbols.superstate,
      ),
      valueTest: eq(superstate),
      acceptable: false,
    },
  ],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'BETTER',
      identifier: {
        type: 'SYMBOL',
        symbol: superstate,
      },
      attribute: {
        type: 'SYMBOL',
        symbol:
          runtime.predefinedSymbols.operator,
      },
      value: {
        type: 'SYMBOL',
        symbol: o1,
      },
      referent: {
        type: 'SYMBOL',
        symbol: o2,
      },
      support: 'UNKNOWN',
    },
  ],
  instantiations: [],
}

for (
  const production of [
    proposeO1,
    proposeO2,
    resolveTie,
  ]
) {
  assert.equal(
    runtime.productionRuntime
      .productionInstaller
      .install(production),
    'NO_REFRACTED_INSTANTIATION',
  )
}

const source =
  runtime.workingMemory.createElement(
    rootGoal,
    valueAttribute,
    fortyTwo,
    false,
  )

runtime.workingMemory.scheduleAdd(source)
runtime.workingMemory.applyBufferedChanges()

let sawTie = false
let sawBetter = false
let resolved = false
 
for (let step = 0; step < 200; step += 1) {
  const phaseResult = runtime.phaseRuntime
    .phaseExecutor
    .executeOnePhase()


  const lower = top.lower

  if (
    lower !== null &&
    runtime.structuralRegistry
      .get(lower.goal)
      .impasseWmes
      .some(
        wme =>
          wme.attribute ===
            runtime.predefinedSymbols.impasse &&
          wme.value ===
            runtime.predefinedSymbols.tie,
      )
  ) {
    sawTie = true
  }


  const better =
    resolveTie.instantiations
      .flatMap(
        instantiation =>
          instantiation.generatedPreferences,
      )
      .find(
        preference =>
          preference.type === 'BETTER' &&
          preference.identifier === rootGoal &&
          preference.attribute ===
            runtime.predefinedSymbols.operator &&
          preference.value === o1 &&
          preference.referent === o2,
      )

  if (better !== undefined) {
    sawBetter = true
  }

  const selected =
    runtime.workingMemory
      .getElements()
      .filter(
        wme =>
          wme.identifier === rootGoal &&
          wme.attribute ===
            runtime.predefinedSymbols.operator &&
          !wme.acceptable,
      )

  if (
    sawTie &&
    sawBetter &&
    top.lower === null &&
    selected.length === 1 &&
    selected[0].value === o1
  ) {
    resolved = true
    break
  }
}

assert.equal(
  sawTie,
  true,
  'two equally acceptable operators must create a TIE substate',
)

assert.equal(
  sawBetter,
  true,
  'the lower-context production must create O1 BETTER O2 on the parent',
)


assert.equal(
  resolved,
  true,
  'parent redecision must select O1 and remove the resolved substate',
)

assert.equal(
  top.lower,
  null,
  'resolved impasse must leave no lower context',
)

assert.equal(
  runtime.contextStack.bottom,
  top,
  'context stack must return to the top context',
)

assert.equal(
  runtime.workingMemory
    .getElements()
    .some(
      wme =>
        runtime.goalStateRegistry.isGoal(
          wme.identifier,
        ) &&
        runtime.goalStateRegistry.getLevel(
          wme.identifier,
        ) > 1,
    ),
  false,
  'removed substate must leave no installed lower-goal WME',
)

console.log(
  'AZ controlled impasse resolution: OK',
)





















