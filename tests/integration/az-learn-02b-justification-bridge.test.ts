import assert from 'node:assert/strict'

import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZCompletedInstantiationHandler } from '../../src/engines/cognitive/az/core/production/AZInstantiationFiringEngine'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionInstaller } from '../../src/engines/cognitive/az/core/production/AZProductionInstaller'
import { AZCausalRuleGeneralizer } from '../../src/engines/cognitive/az/core/learning/AZCausalRuleGeneralizer'
import { AZExperientialLearningHandler } from '../../src/engines/cognitive/az/core/learning/AZExperientialLearningHandler'
import { AZJustificationLearningBridge } from '../../src/engines/cognitive/az/core/learning/AZJustificationLearningBridge'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const state = symbols.makeIdentifier('S')
const operator = symbols.makeIdentifier('O')
const operatorAttribute = symbols.makeStringConstant('operator')
const nameAttribute = symbols.makeStringConstant('name')
const selected = symbols.makeStringConstant('selected')
const phase = symbols.makeStringConstant('phase')
const ready = symbols.makeStringConstant('ready')

const justification: AZProduction = {
  name: 'az-justify-experience',
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
  productionNode: null,
}

const original: AZInstantiation = {
  id: 1,
  production: null,
  instantiatedConditions: [],
  matchGoal: state,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const justified: AZInstantiation = {
  ...original,
  id: 2,
  production: justification,
}

let justificationCalls = 0

const normalHandler: AZCompletedInstantiationHandler = {
  handle() {
    justificationCalls++
    return [justified]
  },
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

const disabled = new AZJustificationLearningBridge(
  normalHandler,
  learner,
  false,
)

assert.deepEqual(disabled.handle(original), [justified])
assert.equal(installed.length, 0)

const enabled = new AZJustificationLearningBridge(
  normalHandler,
  learner,
  true,
)

assert.deepEqual(enabled.handle(original), [justified])
assert.equal(installed.length, 1)
assert.equal(installed[0].name, 'az-learn-experience-1')
const learnedCondition = installed[0].conditions[0]
assert.equal(learnedCondition.type, 'POSITIVE')
if (learnedCondition.type !== 'POSITIVE') {
  throw new Error('Expected a positive learned condition')
}
assert.equal(
  learnedCondition.identifierTest.referent?.type,
  'VARIABLE',
)

assert.equal(justificationCalls, 2)
assert.equal(justification.productionNode, null)

console.log('AZ LEARN 02B-1 justification bridge: OK')
