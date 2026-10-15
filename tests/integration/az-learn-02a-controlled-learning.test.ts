import assert from 'node:assert/strict'

import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZCausalRuleGeneralizer } from '../../src/engines/cognitive/az/core/learning/AZCausalRuleGeneralizer'
import { AZExperientialLearningHandler } from '../../src/engines/cognitive/az/core/learning/AZExperientialLearningHandler'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionInstaller } from '../../src/engines/cognitive/az/core/production/AZProductionInstaller'

const symbols = new AZSymbolManager()
const state = symbols.makeIdentifier('S')
const operator = symbols.makeIdentifier('O')
const operatorAttribute = symbols.makeStringConstant('operator')
const nameAttribute = symbols.makeStringConstant('name')
const selected = symbols.makeStringConstant('selected')
const phase = symbols.makeStringConstant('phase')
const ready = symbols.makeStringConstant('ready')

const source: AZProduction = {
  name: 'az-learn-02-source',
  declaredSupport: 'O_SUPPORT',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: { type: 'EQUALITY', referent: state },
      attributeTest: { type: 'EQUALITY', referent: operatorAttribute },
      valueTest: { type: 'EQUALITY', referent: operator },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: { type: 'EQUALITY', referent: operator },
      attributeTest: { type: 'EQUALITY', referent: nameAttribute },
      valueTest: { type: 'EQUALITY', referent: selected },
      acceptable: false,
    },
  ],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: { type: 'SYMBOL', symbol: state },
      attribute: { type: 'SYMBOL', symbol: phase },
      value: { type: 'SYMBOL', symbol: ready },
      support: 'O_SUPPORT',
    },
  ],
  instantiations: [],
}

const installed: AZProduction[] = []

const installer: AZProductionInstaller = {
  install(production) {
    installed.push(production)
    return 'NO_REFRACTED_INSTANTIATION'
  },
}

const learner = new AZExperientialLearningHandler(
  new AZCausalRuleGeneralizer(symbols),
  installer,
)

const accepted = learner.learn(
  'az-learn-02-candidate',
  source,
)

assert.equal(accepted, true)
assert.equal(installed.length, 1)

const learned = installed[0]

assert.equal(learned.name, 'az-learn-02-candidate')
assert.equal(
  learned.conditions[0].type === 'POSITIVE'
    ? learned.conditions[0].identifierTest.referent?.type
    : null,
  'VARIABLE',
)

assert.equal(
  source.conditions[0].type === 'POSITIVE'
    ? source.conditions[0].identifierTest.referent
    : null,
  state,
  'Learning must not modify the source justification',
)

const unsupported: AZProduction = {
  ...source,
  name: 'az-learn-02-unsupported',
  conditions: [
    {
      ...source.conditions[0],
      type: 'NEGATIVE',
    },
  ] as AZProduction['conditions'],
  instantiations: [],
}

assert.equal(
  learner.learn('az-learn-02-rejected', unsupported),
  false,
)

assert.equal(
  installed.length,
  1,
  'Rejected candidate must never reach the installer',
)

console.log('AZ LEARN 02A controlled learning: OK')
