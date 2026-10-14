import assert from 'node:assert/strict'

import {
  AZDefaultLinkAdditionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import {
  AZDefaultGoalStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import {
  AZDefaultIdentifierLinkStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultImpasseStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()

const states =
  new AZDefaultIdentifierLinkStateRegistry()

const goals =
  new AZDefaultGoalStateRegistry()

const impasses =
  new AZDefaultImpasseStateRegistry()

const processor =
  new AZDefaultLinkAdditionProcessor(
    states,
    goals,
    impasses,
  )

// Special ownership link: null -> target.
const owned =
  symbols.makeIdentifier('O')

states.register(owned, {
  level: 1,
  promotionLevel: 1,
})

processor.post(null, owned)

assert.equal(
  states.get(owned).linkCount,
  1,
)

// Same promotion level.
const sameFrom =
  symbols.makeIdentifier('S')

const sameTo =
  symbols.makeIdentifier('T')

states.register(sameFrom, {
  level: 2,
  promotionLevel: 2,
})

states.register(sameTo, {
  level: 2,
  promotionLevel: 2,
})

processor.post(sameFrom, sameTo)

assert.equal(
  states.get(sameTo).linkCount,
  1,
)

assert.equal(
  states.get(sameTo)
    .couldBeALinkFromBelow,
  false,
)

// Link from lower stack position.
const belowFrom =
  symbols.makeIdentifier('B')

const belowTo =
  symbols.makeIdentifier('C')

states.register(belowFrom, {
  level: 4,
  promotionLevel: 4,
})

states.register(belowTo, {
  level: 2,
  promotionLevel: 2,
})

processor.post(belowFrom, belowTo)

assert.equal(
  states.get(belowTo)
    .couldBeALinkFromBelow,
  true,
)

// Deferred promotion.
const promoteFrom =
  symbols.makeIdentifier('P')

const promoteTo =
  symbols.makeIdentifier('Q')

states.register(promoteFrom, {
  level: 1,
  promotionLevel: 1,
})

states.register(promoteTo, {
  level: 3,
  promotionLevel: 3,
})

processor.post(
  promoteFrom,
  promoteTo,
)

assert.equal(
  states.get(promoteTo).promotionLevel,
  1,
)

assert.equal(
  processor.takeNextPromotedIdentifier(),
  promoteTo,
)

// Ordinary link to a goal is ignored.
const sourceToGoal =
  symbols.makeIdentifier('G')

const goal =
  symbols.makeIdentifier('G')

states.register(sourceToGoal, {
  level: 1,
  promotionLevel: 1,
})

states.register(goal, {
  level: 1,
  promotionLevel: 1,
})

goals.registerGoal(goal, 1)

processor.post(
  sourceToGoal,
  goal,
)

assert.equal(
  states.get(goal).linkCount,
  0,
)

// Special ownership link to a goal remains valid.
processor.post(null, goal)

assert.equal(
  states.get(goal).linkCount,
  1,
)

// Ordinary link to an impasse is ignored.
const sourceToImpasse =
  symbols.makeIdentifier('I')

const impasse =
  symbols.makeIdentifier('I')

states.register(sourceToImpasse, {
  level: 1,
  promotionLevel: 1,
})

states.register(impasse, {
  level: 1,
  promotionLevel: 1,
})

impasses.registerImpasse(impasse)

processor.post(
  sourceToImpasse,
  impasse,
)

assert.equal(
  states.get(impasse).linkCount,
  0,
)

// Special ownership link to an impasse remains valid.
processor.post(null, impasse)

assert.equal(
  states.get(impasse).linkCount,
  1,
)

assert.equal(
  processor.hasPendingPromotions(),
  false,
)

console.log(
  'AZ autonomous link-addition processing: OK',
)
