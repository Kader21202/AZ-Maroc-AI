import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'

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

const rootGoal = topCreator.create().goal

const s = symbols.makeVariable('<s>')
const v = symbols.makeVariable('<v>')

const valueAttribute =
  symbols.makeStringConstant('value')

const resultAttribute =
  symbols.makeStringConstant('result')

const production: AZProduction = {
  name: 'az-rete-variable-propagation',
  declaredSupport: 'I_SUPPORT',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: {
        type: 'EQUALITY',
        referent: s,
      },
      attributeTest: {
        type: 'EQUALITY',
        referent: valueAttribute,
      },
      valueTest: {
        type: 'EQUALITY',
        referent: v,
      },
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
        symbol: resultAttribute,
      },
      value: {
        type: 'SYMBOL',
        symbol: v,
      },
      support: 'I_SUPPORT',
    },
  ],
  instantiations: [],
}

assert.equal(
  runtime.productionRuntime
    .productionInstaller
    .install(production),
  'NO_REFRACTED_INSTANTIATION',
)

const duplicate: AZProduction = {
  ...production,
  instantiations: [],
  productionNode: null,
}

assert.equal(
  runtime.productionRuntime
    .productionMatcher
    .addProduction(duplicate),
  'DUPLICATE_PRODUCTION',
)

assert.equal(
  duplicate.productionNode ?? null,
  null,
)

const fortyTwo =
  symbols.makeIntegerConstant(42)

const source =
  runtime.workingMemory.createElement(
    rootGoal,
    valueAttribute,
    fortyTwo,
    false,
  )

runtime.workingMemory.scheduleAdd(source)
runtime.workingMemory.applyBufferedChanges()

assert.equal(
  runtime.productionRuntime.matchSet.hasAssertion(
    'I_ASSERTION',
    rootGoal,
  ),
  true,
  'source WME must create an I-assertion',
)

/*
 * A source removed before firing must cancel its
 * pending assertion. Re-adding it must recreate
 * the match.
 */
runtime.workingMemory.scheduleRemove(source)
runtime.workingMemory.applyBufferedChanges()

assert.equal(
  runtime.productionRuntime.matchSet.hasAssertion(
    'I_ASSERTION',
    rootGoal,
  ),
  false,
  'pre-fire removal must cancel the assertion',
)

runtime.workingMemory.scheduleAdd(source)
runtime.workingMemory.applyBufferedChanges()

assert.equal(
  runtime.productionRuntime.matchSet.hasAssertion(
    'I_ASSERTION',
    rootGoal,
  ),
  true,
  're-adding source must recreate the assertion',
)

let executedPhases = 0
let resultWmes =
  runtime.workingMemory
    .getElements()
    .filter(
      wme =>
        wme.identifier === rootGoal &&
        wme.attribute === resultAttribute,
    )

while (
  executedPhases < 20 &&
  resultWmes.length === 0
) {
  runtime.phaseRuntime
    .phaseExecutor
    .executeOnePhase()

  executedPhases += 1

  resultWmes =
    runtime.workingMemory
      .getElements()
      .filter(
        wme =>
          wme.identifier === rootGoal &&
          wme.attribute === resultAttribute,
      )
}

assert.equal(
  resultWmes.length,
  1,
  'accepted RHS preference must materialize exactly one result WME',
)

assert.equal(
  resultWmes[0].value,
  fortyTwo,
  'RETE binding must propagate the exact input symbol through the RHS',
)

assert.equal(
  production.instantiations.length,
  1,
  'exactly one fired instantiation must remain registered',
)

const firedInstantiation =
  production.instantiations[0]

assert.equal(
  firedInstantiation.generatedPreferences.some(
    preference =>
      preference.identifier === rootGoal &&
      preference.attribute === resultAttribute &&
      preference.value === fortyTwo,
  ),
  true,
  'fired instantiation must own the propagated result preference',
)

runtime.workingMemory.scheduleRemove(source)
runtime.workingMemory.applyBufferedChanges()

assert.equal(
  firedInstantiation.reteToken,
  null,
  'source removal must detach the fired RETE instantiation',
)

assert.equal(
  runtime.productionRuntime.matchSet.hasRetraction(rootGoal),
  false,
  'zero-link goal retraction must not remain on the ordinary goal queue',
)

const retractedInstantiation =
  runtime.productionRuntime.matchSet
    .takeNextNilGoalRetraction()

assert.equal(
  retractedInstantiation,
  firedInstantiation,
  'source removal must preserve exact instantiation identity through NIL-goal retraction',
)

console.log(
  'AZ RETE variable propagation through cognitive runtime: OK',
)
