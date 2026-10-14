import assert from 'node:assert/strict'

import {
  AZDefaultIdentifierGarbageCollector,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierGarbageCollector'
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
  AZPreference,
} from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type {
  AZInstantiation,
} from '../../src/engines/cognitive/az/core/production/AZInstantiation'
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

const collector =
  new AZDefaultIdentifierGarbageCollector(
    preferenceMemory,
    workingMemory,
  )

const identifier =
  symbols.makeIdentifier('G')

const other =
  symbols.makeIdentifier('O')

const value =
  symbols.makeIdentifier('V')

const slotValue =
  symbols.makeIdentifier('S')

const attribute =
  symbols.makeStringConstant('attr')

for (
  const symbol of [
    identifier,
    other,
    value,
    slotValue,
  ]
) {
  states.register(symbol, {
    linkCount: 1,
    level: 3,
    promotionLevel: 3,
    couldBeALinkFromBelow: false,
  })
}

const ownedWme =
  workingMemory.createElement(
    identifier,
    attribute,
    value,
  )

const unrelatedWme =
  workingMemory.createElement(
    other,
    attribute,
    value,
  )

workingMemory.scheduleAdd(ownedWme)
workingMemory.scheduleAdd(unrelatedWme)
workingMemory.applyBufferedChanges()

const instantiation:
  AZInstantiation = {
    id: 1,
    production: null,
    instantiatedConditions: [],
    matchGoal: null,
    matchGoalLevel: 3,
    inMatchSet: false,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }

const preference:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier,
    attribute,
    value,
    referent: null,
    level: 3,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation,
  }

preferenceMemory.add(preference)

const slot =
  preferenceMemory.getSlot(
    identifier,
    attribute,
  )

assert.notEqual(slot, null)

const slotWme =
  workingMemory.createElement(
    identifier,
    attribute,
    slotValue,
  )

slot!.wmes.push(slotWme)

collector.collect(identifier)

assert.equal(
  slot!.wmes.length,
  0,
)

assert.equal(
  slot!.allPreferences.length,
  0,
)

assert.equal(
  preference.inTemporaryMemory,
  false,
)

assert.equal(
  preference.slot,
  null,
)

assert.equal(
  slot!.markedForPossibleRemoval,
  true,
)

/*
 * Scheduled removals become effective
 * only when buffered changes are applied.
 */
workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory
    .getElements()
    .includes(ownedWme),
  false,
)

assert.equal(
  workingMemory
    .getElements()
    .includes(unrelatedWme),
  true,
)

preferenceMemory.removeGarbageSlots()

assert.equal(
  preferenceMemory.getSlot(
    identifier,
    attribute,
  ),
  null,
)

const overlapParent = symbols.makeIdentifier('P')
const overlapChild = symbols.makeIdentifier('C')
const overlapAttribute = symbols.makeStringConstant('overlap')

states.register(overlapParent, {
  linkCount: 1,
  level: 3,
  promotionLevel: 3,
  couldBeALinkFromBelow: false,
})

states.register(overlapChild, {
  linkCount: 0,
  level: 3,
  promotionLevel: 3,
  couldBeALinkFromBelow: false,
})

const overlapPreference: AZPreference = {
  type: 'ACCEPTABLE',
  identifier: overlapParent,
  attribute: overlapAttribute,
  value: symbols.makeStringConstant('candidate'),
  referent: null,
  level: 3,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation,
}

preferenceMemory.add(overlapPreference)

const overlapSlot =
  preferenceMemory.getSlot(
    overlapParent,
    overlapAttribute,
  )

if (overlapSlot === null) {
  throw new Error(
    'Expected overlap slot for AZ garbage-collection regression',
  )
}

const overlappingWme =
  workingMemory.createElement(
    overlapParent,
    overlapAttribute,
    overlapChild,
  )

overlapSlot.wmes.push(overlappingWme)
workingMemory.scheduleAdd(overlappingWme)
workingMemory.applyBufferedChanges()

assert.equal(
  states.get(overlapChild).linkCount,
  1,
)

collector.collect(overlapParent)

assert.equal(
  states.get(overlapChild).linkCount,
  0,
  'AZ invariant: garbage collection must remove one committed slot WME link exactly once',
)

console.log(
  'AZ autonomous identifier garbage collector: OK',
)
