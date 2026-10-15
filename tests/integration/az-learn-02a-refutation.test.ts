import assert from 'node:assert/strict'

import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZCausalRuleGeneralizer } from '../../src/engines/cognitive/az/core/learning/AZCausalRuleGeneralizer'
import { AZExperientialLearningHandler } from '../../src/engines/cognitive/az/core/learning/AZExperientialLearningHandler'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionInstaller } from '../../src/engines/cognitive/az/core/production/AZProductionInstaller'

const symbols = new AZSymbolManager()
const s = symbols.makeIdentifier('S')
const o = symbols.makeIdentifier('O')
const orphan = symbols.makeIdentifier('X')

const operatorAttribute = symbols.makeStringConstant('operator')
const nameAttribute = symbols.makeStringConstant('name')
const selected = symbols.makeStringConstant('selected')
const phase = symbols.makeStringConstant('phase')
const ready = symbols.makeStringConstant('ready')

const source: AZProduction = {
  name: 'az-learn-02-refutation-source',
  declaredSupport: 'O_SUPPORT',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: { type: 'EQUALITY', referent: s },
      attributeTest: { type: 'EQUALITY', referent: operatorAttribute },
      valueTest: { type: 'EQUALITY', referent: o },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: { type: 'EQUALITY', referent: o },
      attributeTest: { type: 'EQUALITY', referent: nameAttribute },
      valueTest: { type: 'EQUALITY', referent: selected },
      acceptable: false,
    },
  ],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: { type: 'SYMBOL', symbol: s },
      attribute: { type: 'SYMBOL', symbol: phase },
      value: { type: 'SYMBOL', symbol: ready },
      support: 'O_SUPPORT',
    },
  ],
  instantiations: [],
}

let installCalls = 0

const installer: AZProductionInstaller = {
  install() {
    installCalls++
    return 'NO_REFRACTED_INSTANTIATION'
  },
}

const learner = new AZExperientialLearningHandler(
  new AZCausalRuleGeneralizer(symbols),
  installer,
)

/*
 * Test 1: An identifier used only in an action
 * must not become an unbound RHS variable.
 */
const unbound: AZProduction = {
  ...source,
  name: 'az-learn-02-unbound',
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: { type: 'SYMBOL', symbol: orphan },
      attribute: { type: 'SYMBOL', symbol: phase },
      value: { type: 'SYMBOL', symbol: ready },
      support: 'O_SUPPORT',
    },
  ],
  instantiations: [],
}

assert.equal(
  learner.learn('az-learn-02-unbound-candidate', unbound),
  false,
  'Unbound RHS variable must be rejected',
)

assert.equal(
  installCalls,
  0,
  'Rejected candidate must not reach installer',
)

/*
 * Test 2: Duplicate installation must not count
 * as successful learning.
 */
const duplicateInstaller: AZProductionInstaller = {
  install() {
    return 'DUPLICATE_PRODUCTION'
  },
}

const duplicateLearner = new AZExperientialLearningHandler(
  new AZCausalRuleGeneralizer(symbols),
  duplicateInstaller,
)

assert.equal(
  duplicateLearner.learn('az-learn-02-duplicate', source),
  false,
  'Duplicate production must not count as learning',
)

/*
 * Test 3: Installation failures must remain visible.
 * The current contract propagates exceptions.
 */
const failingInstaller: AZProductionInstaller = {
  install() {
    throw new Error('AZ-LEARN-02-INSTALL-FAILURE')
  },
}

const failingLearner = new AZExperientialLearningHandler(
  new AZCausalRuleGeneralizer(symbols),
  failingInstaller,
)

assert.throws(
  () => failingLearner.learn('az-learn-02-failure', source),
  /AZ-LEARN-02-INSTALL-FAILURE/,
  'Installer failures must not be silently reported as success',
)

console.log('AZ LEARN 02A refutation tests: OK')
