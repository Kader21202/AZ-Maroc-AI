import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZCausalRuleGeneralizer } from '../../src/engines/cognitive/az/core/learning/AZCausalRuleGeneralizer'
import { AZExperientialLearningHandler } from '../../src/engines/cognitive/az/core/learning/AZExperientialLearningHandler'
import { AZJustificationLearningBridge } from '../../src/engines/cognitive/az/core/learning/AZJustificationLearningBridge'
import { AZJustificationMaterializer } from '../../src/engines/cognitive/az/core/production/AZJustificationMaterializer'
import { AZProductionRuntimeAssembly } from '../../src/engines/cognitive/az/core/production/AZProductionRuntimeAssembly'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'

const symbols = new AZSymbolManager()
const predefined = new AZPredefinedSymbols(symbols)
const memory = new AZWorkingMemory()

const s1 = symbols.makeIdentifier('S')
const o1 = symbols.makeIdentifier('O')
const name = symbols.makeStringConstant('name')
const selected = symbols.makeStringConstant('selected')
const phase = symbols.makeStringConstant('phase')
const ready = symbols.makeStringConstant('ready')

const runtime = new AZProductionRuntimeAssembly(
  memory,
  {
    isGoal: symbol => symbol === s1,
    getLevel: () => 1,
  },
  predefined.operator,
)

const original: AZInstantiation = {
  id: 1,
  production: null,
  instantiatedConditions: [],
  matchGoal: s1,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const result: AZPreference = {
  type: 'ACCEPTABLE',
  identifier: s1,
  attribute: phase,
  value: ready,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: true,
  inTemporaryMemory: true,
  slot: null,
  instantiation: original,
}

const justification = new AZJustificationMaterializer().materialize(
  'az-justify-repeat',
  [
    memory.createElement(s1, predefined.operator, o1, false),
    memory.createElement(o1, name, selected, false),
  ],
  [result],
)

const bridge = new AZJustificationLearningBridge(
  {
    handle() {
      return [{ ...original, production: justification }]
    },
  },
  new AZExperientialLearningHandler(
    new AZCausalRuleGeneralizer(symbols),
    runtime.productionInstaller,
  ),
  true,
)

bridge.handle(original)
bridge.handle(original)

const learned = runtime.proceduralMemory.getAll().filter(
  production => production.name.startsWith('az-learn-experience-'),
)

assert.equal(
  learned.length,
  1,
  'Repeated identical experience must not install duplicate learned rules.',
)

console.log('AZ LEARN 02C-2 repeated experience: OK')
