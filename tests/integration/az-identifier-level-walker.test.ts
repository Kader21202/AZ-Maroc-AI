import assert from 'node:assert/strict'

import {
  AZDefaultIdentifierLevelWalker,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierLevelWalker'
import {
  AZDefaultLinkAdditionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import {
  AZDefaultLinkRemovalProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import {
  AZPreferenceMemory,
} from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import {
  AZWorkingMemory,
} from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type {
  AZInstantiation,
} from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type {
  AZPreference,
} from '../../src/engines/cognitive/az/core/operator/AZPreference'
import {
  AZDefaultGoalStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import {
  AZDefaultIdentifierLinkStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultImpasseStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import {
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const states =
  new AZDefaultIdentifierLinkStateRegistry()
const goals =
  new AZDefaultGoalStateRegistry()
const impasses =
  new AZDefaultImpasseStateRegistry()

const removals =
  new AZDefaultLinkRemovalProcessor(
    states,
    goals,
    impasses,
  )

const additions =
  new AZDefaultLinkAdditionProcessor(
    states,
    goals,
    impasses,
  )

const workingMemory =
  new AZWorkingMemory(
    additions,
    removals,
  )

const preferenceMemory =
  new AZPreferenceMemory(
    additions,
    removals,
  )

const walker =
  new AZDefaultIdentifierLevelWalker(
    workingMemory,
    preferenceMemory,
    states,
    removals,
  )

const root =
  symbols.makeIdentifier('R')
const viaWme =
  symbols.makeIdentifier('W')
const viaPreference =
  symbols.makeIdentifier('P')
const viaReferent =
  symbols.makeIdentifier('B')
const viaImpasse =
  symbols.makeIdentifier('I')
const viaSlotWme =
  symbols.makeIdentifier('S')
const aboveBoundary =
  symbols.makeIdentifier('A')

const attribute =
  symbols.makeStringConstant('attr')
const constant =
  symbols.makeStringConstant('constant')

for (
  const [
    identifier,
    level,
  ] of [
    [root, 5],
    [viaWme, 6],
    [viaPreference, 6],
    [viaReferent, 7],
    [viaImpasse, 8],
    [viaSlotWme, 9],
    [aboveBoundary, 2],
  ] as const
) {
  states.register(identifier, {
    linkCount: 1,
    level,
    promotionLevel: level,
    couldBeALinkFromBelow: false,
  })
}

workingMemory.scheduleAdd(
  workingMemory.createElement(
    root,
    attribute,
    viaWme,
  ),
)

workingMemory.scheduleAdd(
  workingMemory.createElement(
    viaWme,
    attribute,
    root,
  ),
)

workingMemory.scheduleAdd(
  workingMemory.createElement(
    root,
    attribute,
    aboveBoundary,
  ),
)

workingMemory.applyBufferedChanges()

const instantiation: AZInstantiation = {
  id: 1,
  production: null,
  instantiatedConditions: [],
  matchGoal: null,
  matchGoalLevel: 5,
  inMatchSet: false,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const binaryPreference: AZPreference = {
  type: 'BETTER',
  identifier: root,
  attribute,
  value: viaPreference,
  referent: viaReferent,
  level: 5,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation,
}

preferenceMemory.add(
  binaryPreference,
)

const constantPreference: AZPreference = {
  type: 'ACCEPTABLE',
  identifier: root,
  attribute,
  value: constant,
  referent: null,
  level: 5,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation,
}

preferenceMemory.add(
  constantPreference,
)

const slot =
  preferenceMemory.getSlot(
    root,
    attribute,
  )

assert.notEqual(slot, null)

slot!.impasseId = viaImpasse

slot!.wmes.push(
  workingMemory.createElement(
    root,
    attribute,
    viaSlotWme,
  ),
)

for (
  const identifier of [
    root,
    viaWme,
    viaPreference,
    viaReferent,
    viaImpasse,
    viaSlotWme,
  ]
) {
  removals.addUnknownLevelIdentifier(
    identifier,
  )
}

walker.walk(
  root,
  501,
  3,
)

for (
  const identifier of [
    root,
    viaWme,
    viaPreference,
    viaReferent,
    viaImpasse,
    viaSlotWme,
  ]
) {
  const state =
    states.get(identifier)

  assert.equal(
    state.level,
    3,
  )

  assert.equal(
    state.promotionLevel,
    3,
  )

  assert.equal(
    removals
      .getUnknownLevelIdentifiers()
      .includes(identifier),
    false,
  )
}

/*
 * Not unknown and already above the walk level:
 * historical walker must leave it unchanged.
 */
assert.equal(
  states.get(aboveBoundary).level,
  2,
)

assert.equal(
  states.get(aboveBoundary).promotionLevel,
  2,
)

console.log(
  'AZ autonomous identifier level walker: OK',
)



