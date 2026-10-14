import assert from 'node:assert/strict'

import { AZAcceptablePreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/memory/AZAcceptablePreferenceWmeRegistry'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceWmeRegistry'
import { AZDefaultWmePreferenceResolver } from '../../src/engines/cognitive/az/core/decision/AZDefaultWmePreferenceResolver'
import { AZImpasseItemBacktraceRegistry } from '../../src/engines/cognitive/az/core/decision/AZImpasseItemBacktraceRegistry'
import { AZNonContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZNonContextPreferenceWmeRegistry'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const workingMemory = new AZWorkingMemory()

const contextRegistry =
  new AZContextPreferenceWmeRegistry()

const nonContextRegistry =
  new AZNonContextPreferenceWmeRegistry()

const acceptableRegistry =
  new AZAcceptablePreferenceWmeRegistry()

const impasseRegistry =
  new AZImpasseItemBacktraceRegistry()

const resolver =
  new AZDefaultWmePreferenceResolver(
    contextRegistry,
    nonContextRegistry,
    acceptableRegistry,
    impasseRegistry,
  )

let nextInstantiationId = 1

function makePreference(): AZPreference {
  const identifier =
    symbols.makeIdentifier('S')

  const attribute =
    symbols.makeStringConstant('attribute')

  const value =
    symbols.makeStringConstant('value')

  const instantiation: AZInstantiation = {
    id: nextInstantiationId++,
    production: null,
    instantiatedConditions: [],
    matchGoal: null,
    matchGoalLevel: 1,
    inMatchSet: true,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }

  return {
    type: 'ACCEPTABLE',
    identifier,
    attribute,
    value,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation,
  }
}

const identifier =
  symbols.makeIdentifier('S')

const attribute =
  symbols.makeStringConstant('status')

const value =
  symbols.makeStringConstant('active')

const wme =
  workingMemory.createElement(
    identifier,
    attribute,
    value,
    false,
  )

assert.equal(
  resolver.resolve(wme),
  null,
  'a WME without provenance must resolve to null',
)

const preference =
  makePreference()

nonContextRegistry.set(
  wme,
  preference,
)

assert.equal(
  resolver.resolve(wme),
  preference,
  'a single provenance association must resolve to its preference',
)

nonContextRegistry.remove(wme)

contextRegistry.set(
  wme,
  preference,
)

acceptableRegistry.set(
  wme,
  preference,
)

assert.equal(
  resolver.resolve(wme),
  preference,
  'the same preference present in multiple registries is not a conflict',
)

const conflictingPreference =
  makePreference()

acceptableRegistry.set(
  wme,
  conflictingPreference,
)

assert.throws(
  () => resolver.resolve(wme),
  /conflicting preference provenance/,
  'different preferences for the same WME must be detected',
)

console.log(
  'AZ WME preference resolver: OK',
)
