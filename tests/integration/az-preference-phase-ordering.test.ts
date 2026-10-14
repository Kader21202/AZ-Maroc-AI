import assert from 'node:assert/strict'

import { AZInnerElaborationWaterfallEngine } from '../../src/engines/cognitive/az/core/cycle/AZInnerElaborationWaterfallEngine'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZInstantiationFiringEngine } from '../../src/engines/cognitive/az/core/production/AZInstantiationFiringEngine'
import { AZInstantiationRetractor } from '../../src/engines/cognitive/az/core/production/AZInstantiationRetractor'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZNewPreferenceAsserter } from '../../src/engines/cognitive/az/core/production/AZNewPreferenceAsserter'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import { DefaultActiveGoalResolver } from '../../src/engines/cognitive/az/core/state/DefaultActiveGoalResolver'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const identifiers = new AZDefaultIdentifierLinkStateRegistry()
const preferences = new AZPreferenceMemory()
const stack = new AZStateStack()

const goal = symbols.makeIdentifier('S')
identifiers.register(goal, { level: 1, promotionLevel: 1 })
const top = stack.setTop({}, goal)

const attribute = symbols.makeStringConstant('operator')
const oldValue = symbols.makeStringConstant('old')
const newValue = symbols.makeStringConstant('new')

function production(name: string, value: typeof newValue): {
  production: AZProduction
  node: AZProductionNode
  token: AZToken
} {
  const p: AZProduction = {
    name,
    declaredSupport: 'I_SUPPORT',
    conditions: [],
    actions: [{
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: { type: 'SYMBOL', symbol: goal },
      attribute: { type: 'SYMBOL', symbol: attribute },
      value: { type: 'SYMBOL', symbol: value },
      support: 'I_SUPPORT',
    }],
    instantiations: [],
    productionNode: null,
  }

  const node = {
    type: 'PRODUCTION',
    production: p,
    parent: null,
    children: [],
    tokens: [],
  } as unknown as AZProductionNode
  p.productionNode = node

  const parent: AZToken = {
    parent: null, workingMemoryElement: null, node: null,
    hashReferent: null, negativeMatches: [], children: [],
  }
  const token: AZToken = {
    parent, workingMemoryElement: null, node,
    hashReferent: null, negativeMatches: [], children: [],
  }

  return { production: p, node, token }
}

const oldRuntime = production('old-production', oldValue)
const newRuntime = production('new-production', newValue)

const oldInstantiation: AZInstantiation = {
  id: 1,
  production: oldRuntime.production,
  instantiatedConditions: [],
  matchGoal: goal,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}
oldRuntime.production.instantiations.push(oldInstantiation)

const oldPreference = {
  type: 'ACCEPTABLE' as const,
  identifier: goal,
  attribute,
  value: oldValue,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation: oldInstantiation,
}
oldInstantiation.generatedPreferences.push(oldPreference)
preferences.add(oldPreference)

const matchSet = new AZMatchSet()
matchSet.addRetraction({
  instantiation: oldInstantiation,
  productionNode: oldRuntime.node,
})
matchSet.addAssertion({
  type: 'I_ASSERTION',
  production: newRuntime.production,
  token: newRuntime.token,
  wme: null,
  matchGoal: goal,
  matchGoalLevel: 1,
})

const events: string[] = []

class TracingAsserter extends AZNewPreferenceAsserter {
  public override assert(instantiations: readonly AZInstantiation[]) {
    if (instantiations.length > 0) events.push('assert:new')
    return super.assert(instantiations)
  }
}

class TracingRetractor extends AZInstantiationRetractor {
  public override retract(instantiation: AZInstantiation): void {
    if (instantiation === oldInstantiation) events.push('retract:old')
    super.retract(instantiation)
  }
}

const engine = new AZInnerElaborationWaterfallEngine(
  new AZInstantiationFiringEngine(symbols, identifiers),
  new TracingAsserter(preferences),
  new DefaultActiveGoalResolver(),
  new TracingRetractor(preferences),
  identifiers,
)

engine.execute(
  matchSet,
  top,
  1,
  'PROPOSE',
  'IE_PRODS',
)

assert.deepEqual(
  events,
  ['assert:new', 'retract:old'],
  'AZ preference waterfall ordering requires new preference assertions before old retractions',
)

console.log('AZ preference-phase ordering: OK')
