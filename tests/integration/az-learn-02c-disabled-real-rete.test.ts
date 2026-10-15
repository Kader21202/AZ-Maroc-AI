import assert from 'node:assert/strict'

import { AZWmeCausalProvenanceRegistry } from '../../src/engines/cognitive/az/core/AZWmeCausalProvenanceRegistry'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZCausalRuleGeneralizer } from '../../src/engines/cognitive/az/core/learning/AZCausalRuleGeneralizer'
import { AZExperientialLearningHandler } from '../../src/engines/cognitive/az/core/learning/AZExperientialLearningHandler'
import { AZJustificationLearningBridge } from '../../src/engines/cognitive/az/core/learning/AZJustificationLearningBridge'
import { AZInstantiationFiringEngine } from '../../src/engines/cognitive/az/core/production/AZInstantiationFiringEngine'
import { AZJustificationInstantiationCreator } from '../../src/engines/cognitive/az/core/production/AZJustificationInstantiationCreator'
import { AZJustificationMaterializer } from '../../src/engines/cognitive/az/core/production/AZJustificationMaterializer'
import { AZProductionRuntimeAssembly } from '../../src/engines/cognitive/az/core/production/AZProductionRuntimeAssembly'
import { AZSubstateGroundExtractor } from '../../src/engines/cognitive/az/core/production/AZSubstateGroundExtractor'
import { AZSubstateJustificationHandler } from '../../src/engines/cognitive/az/core/production/AZSubstateJustificationHandler'
import { AZSubstateResultDetector } from '../../src/engines/cognitive/az/core/production/AZSubstateResultDetector'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbols = new AZSymbolManager()
const predefined = new AZPredefinedSymbols(symbols)
const memory = new AZWorkingMemory()
const goals = new AZDefaultGoalIdentityRegistry()
const identifiers = new AZDefaultIdentifierLinkStateRegistry()
const provenance = new AZWmeCausalProvenanceRegistry()

const s1 = symbols.makeIdentifier('S')
const s2 = symbols.makeIdentifier('S')
const o1 = symbols.makeIdentifier('O')

goals.registerGoal(s1, 1)
goals.registerGoal(s2, 2)

for (const [identifier, level] of [
  [s1, 1],
  [s2, 2],
  [o1, 1],
] as const) {
  identifiers.register(identifier, {
    level,
    promotionLevel: level,
  })
}

const name = symbols.makeStringConstant('name')
const selected = symbols.makeStringConstant('selected')
const status = symbols.makeStringConstant('status')
const done = symbols.makeStringConstant('done')
const phase = symbols.makeStringConstant('phase')
const ready = symbols.makeStringConstant('ready')

const runtime = new AZProductionRuntimeAssembly(
  memory,
  goals,
  predefined.operator,
  identifiers,
)

const grounds = [
  memory.createElement(s1, predefined.operator, o1, false),
  memory.createElement(o1, name, selected, false),
]

const local = memory.createElement(s2, status, done, false)

for (const wme of [...grounds, local]) {
  memory.scheduleAdd(wme)
}
memory.applyBufferedChanges()

const eq = (referent: AZSymbol) => ({
  type: 'EQUALITY' as const,
  referent,
})

const positive = (
  identifier: AZSymbol,
  attribute: AZSymbol,
  value: AZSymbol,
) => ({
  type: 'POSITIVE' as const,
  identifierTest: eq(identifier),
  attributeTest: eq(attribute),
  valueTest: eq(value),
  acceptable: false,
})

const source: AZProduction = {
  name: 'az-learn-02b-real-source',
  declaredSupport: 'O_SUPPORT',
  conditions: [
    positive(s1, predefined.operator, o1),
    positive(o1, name, selected),
    positive(s2, status, done),
  ],
  actions: [{
    type: 'MAKE',
    preferenceType: 'ACCEPTABLE',
    identifier: { type: 'SYMBOL', symbol: s1 },
    attribute: { type: 'SYMBOL', symbol: phase },
    value: { type: 'SYMBOL', symbol: ready },
    support: 'O_SUPPORT',
  }],
  instantiations: [],
  productionNode: null,
}

assert.equal(
  runtime.productionInstaller.install(source),
  'NO_REFRACTED_INSTANTIATION',
)

assert.equal(
  runtime.matchSet.hasAssertion('O_ASSERTION', s2),
  true,
  'The real RETE must match the source production at S2.',
)

const justificationHandler = new AZSubstateJustificationHandler(
  new AZSubstateResultDetector(goals),
  new AZSubstateGroundExtractor(provenance, identifiers),
  new AZJustificationMaterializer(),
  runtime.productionInstaller,
  new AZJustificationInstantiationCreator(goals),
)

const bridge = new AZJustificationLearningBridge(
  justificationHandler,
  new AZExperientialLearningHandler(
    new AZCausalRuleGeneralizer(symbols),
    runtime.productionInstaller,
  ),
  false,
)

const firing = new AZInstantiationFiringEngine(
  symbols,
  identifiers,
  null,
  undefined,
  bridge,
)

const result = firing.fire(
  runtime.matchSet,
  'O_ASSERTION',
  s2,
  {
    activeLevel: 2,
    highestActiveLevel: 2,
    changeLevel: 0,
    nextChangeLevel: 0,
  },
)

assert.equal(result.createdInstantiations.length, 2)

const [original, justification] = result.createdInstantiations

assert.ok(original)
assert.ok(justification)

assert.equal(original.matchGoal, s2)
assert.equal(original.generatedPreferences.length, 1)
assert.equal(original.generatedPreferences[0]?.identifier, s1)

assert.equal(justification.matchGoal, s1)
assert.equal(justification.instantiatedConditions.length, 2)


assert.equal(
  runtime.proceduralMemory.findByName('az-learn-experience-1'),
  undefined,
  'No generalized rule may be installed when learning is disabled.',
)

assert.ok(
  runtime.proceduralMemory.findByName('az-justify-1'),
  'Normal justification must remain installed.',
)

console.log('AZ LEARN 02C-1 disabled real RETE: OK')
