import assert from 'node:assert/strict'

import {
  AZDefaultIdentifierPromotionBufferProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierPromotionBufferProcessor'
import {
  AZDefaultIdentifierPromotionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierPromotionProcessor'
import {
  AZDefaultIdentifierReferenceProvider,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierReferenceProvider'
import {
  AZDefaultLinkAdditionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
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

const workingMemory =
  new AZWorkingMemory()

const preferenceMemory =
  new AZPreferenceMemory()

const references =
  new AZDefaultIdentifierReferenceProvider(
    workingMemory,
    preferenceMemory,
  )

const promotion =
  new AZDefaultIdentifierPromotionProcessor(
    states,
    goals,
    impasses,
    references,
  )

const a = symbols.makeIdentifier('A')
const b = symbols.makeIdentifier('B')
const c = symbols.makeIdentifier('C')
const d = symbols.makeIdentifier('D')
const e = symbols.makeIdentifier('E')
const goal = symbols.makeIdentifier('G')
const impasse = symbols.makeIdentifier('I')

const attribute =
  symbols.makeStringConstant('link')

const constant =
  symbols.makeStringConstant('constant')

for (
  const identifier of [
    a,
    b,
    c,
    d,
    e,
    goal,
    impasse,
  ]
) {
  states.register(identifier, {
    level: 5,
    promotionLevel: 5,
  })
}

function makeInstantiation(
  id: number,
): AZInstantiation {
  return {
    id,
    production: null,
    instantiatedConditions: [],
    matchGoal: null,
    matchGoalLevel: 5,
    inMatchSet: false,
    generatedPreferences: [],
    reteToken: null,
    reteWme: null,
  }
}

/*
 * Working-memory chain:
 *
 * A -> B
 * C -> A
 *
 * C -> A creates a cycle once B reaches C
 * through preference memory.
 */
const aToB =
  workingMemory.createElement(
    a,
    attribute,
    b,
  )

const cToA =
  workingMemory.createElement(
    c,
    attribute,
    a,
  )

workingMemory.scheduleAdd(aToB)
workingMemory.scheduleAdd(cToA)
workingMemory.applyBufferedChanges()

/*
 * Preference references on B:
 *
 * B -> C      (value)
 * B -> D      (binary referent)
 */
const binaryPreference:
  AZPreference = {
    type: 'BETTER',
    identifier: b,
    attribute,
    value: c,
    referent: d,
    level: 5,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(1),
  }

preferenceMemory.add(
  binaryPreference,
)

/*
 * Constant reference must be ignored.
 */
const constantPreference:
  AZPreference = {
    type: 'ACCEPTABLE',
    identifier: b,
    attribute,
    value: constant,
    referent: null,
    level: 5,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation:
      makeInstantiation(2),
  }

preferenceMemory.add(
  constantPreference,
)

/*
 * slot.wmes is also part of the historical
 * promotion traversal.
 *
 * Keep this WME outside global working memory
 * so this assertion specifically exercises
 * slot.wmes traversal.
 */
const slot =
  preferenceMemory.getSlot(
    b,
    attribute,
  )

assert.notEqual(slot, null)

slot!.wmes.push(
  workingMemory.createElement(
    b,
    attribute,
    e,
  ),
)

/*
 * Promote A from level 5 to level 2.
 *
 * Expected recursive closure:
 * A -> B -> C -> A cycle
 *        -> D binary referent
 *        -> E slot WME
 */
promotion.promote(a, 2)

for (
  const identifier of [
    a,
    b,
    c,
    d,
    e,
  ]
) {
  const state =
    states.get(identifier)

  assert.equal(
    state.level,
    2,
  )

  assert.equal(
    state.promotionLevel,
    2,
  )

  assert.equal(
    state.couldBeALinkFromBelow,
    true,
  )
}

/*
 * No-op when current level is already
 * at or above the requested promotion.
 */
promotion.promote(a, 3)

assert.equal(
  states.get(a).level,
  2,
)

/*
 * No-op when promotionLevel is already
 * below the requested new level.
 */
const blocked =
  symbols.makeIdentifier('X')

states.register(blocked, {
  level: 7,
  promotionLevel: 1,
})

promotion.promote(blocked, 3)

assert.equal(
  states.get(blocked).level,
  7,
)

/*
 * Historical behavior rejects direct
 * promotion of goal and impasse identifiers.
 */
goals.registerGoal(goal, 5)

assert.throws(
  () => promotion.promote(goal, 2),
  /Cannot promote a goal or impasse identifier/,
)

impasses.registerImpasse(impasse)

assert.throws(
  () => promotion.promote(impasse, 2),
  /Cannot promote a goal or impasse identifier/,
)

/*
 * Buffer processor:
 *
 * FROM promotionLevel 1 -> TO promotionLevel 5
 * causes LinkAdditionProcessor to queue TO
 * with promotionLevel 1.
 *
 * Buffer processor must drain that queue and
 * promote TO to the current registered
 * promotionLevel.
 */
const from =
  symbols.makeIdentifier('F')

const to =
  symbols.makeIdentifier('T')

states.register(from, {
  level: 1,
  promotionLevel: 1,
})

states.register(to, {
  level: 5,
  promotionLevel: 5,
})

const additions =
  new AZDefaultLinkAdditionProcessor(
    states,
    goals,
    impasses,
  )

additions.post(from, to)

assert.equal(
  additions.hasPendingPromotions(),
  true,
)

assert.equal(
  states.get(to).promotionLevel,
  1,
)

const buffer =
  new AZDefaultIdentifierPromotionBufferProcessor(
    additions,
    promotion,
    states,
  )

buffer.processAll()

assert.equal(
  additions.hasPendingPromotions(),
  false,
)

assert.equal(
  states.get(to).level,
  1,
)

assert.equal(
  states.get(to).promotionLevel,
  1,
)

/*
 * Multiple pending promotions must be drained
 * by one processAll() call.
 */
const secondFrom =
  symbols.makeIdentifier('F2')

const secondTo =
  symbols.makeIdentifier('T2')

states.register(secondFrom, {
  level: 2,
  promotionLevel: 2,
})

states.register(secondTo, {
  level: 6,
  promotionLevel: 6,
})

additions.post(from, to)
additions.post(secondFrom, secondTo)

assert.equal(
  additions.hasPendingPromotions(),
  true,
)

buffer.processAll()

assert.equal(
  additions.hasPendingPromotions(),
  false,
)

assert.equal(
  states.get(to).level,
  1,
)

assert.equal(
  states.get(to).promotionLevel,
  1,
)

assert.equal(
  states.get(secondTo).level,
  2,
)

assert.equal(
  states.get(secondTo).promotionLevel,
  2,
)
console.log(
  'AZ autonomous identifier promotion: OK',
)
