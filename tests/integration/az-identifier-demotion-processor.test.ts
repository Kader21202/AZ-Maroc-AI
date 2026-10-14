import assert from 'node:assert/strict'

import {
  AZDefaultIdentifierDemotionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierDemotionProcessor'
import {
  AZDefaultIdentifierDemotionQueueProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierDemotionQueueProcessor'
import {
  AZDefaultIdentifierGarbageCollector,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierGarbageCollector'
import {
  AZDefaultIdentifierLevelWalker,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierLevelWalker'
import {
  AZDefaultIdentifierReferenceProvider,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierReferenceProvider'
import {
  AZDefaultIdentifierUnknownLevelMarker,
} from '../../src/engines/cognitive/az/core/decision/AZIdentifierUnknownLevelMarker'
import {
  AZDefaultLinkAdditionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import {
  AZDefaultLinkRemovalProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import {
  AZDefaultTransitiveClosureNumberGenerator,
} from '../../src/engines/cognitive/az/core/decision/AZTransitiveClosureNumberGenerator'
import {
  AZPreferenceMemory,
} from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import {
  AZWorkingMemory,
} from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
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
  AZStateStack,
} from '../../src/engines/cognitive/az/core/state/AZStateStack'
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

const references =
  new AZDefaultIdentifierReferenceProvider(
    workingMemory,
    preferenceMemory,
  )

const queueProcessor =
  new AZDefaultIdentifierDemotionQueueProcessor(
    removals,
    states,
  )

const garbageCollector =
  new AZDefaultIdentifierGarbageCollector(
    preferenceMemory,
    workingMemory,
  )

const marker =
  new AZDefaultIdentifierUnknownLevelMarker(
    references,
    states,
    removals,
  )

const walker =
  new AZDefaultIdentifierLevelWalker(
    workingMemory,
    preferenceMemory,
    states,
    removals,
  )

const tcGenerator =
  new AZDefaultTransitiveClosureNumberGenerator()

const stateStack =
  new AZStateStack()

const topGoal =
  symbols.makeIdentifier('S')

const lowerGoal =
  symbols.makeIdentifier('S')

const reachable =
  symbols.makeIdentifier('R')

const orphan =
  symbols.makeIdentifier('O')

const attribute =
  symbols.makeStringConstant('attr')

const constant =
  symbols.makeStringConstant('constant')

states.register(topGoal, {
  linkCount: 1,
  level: 1,
  promotionLevel: 1,
  couldBeALinkFromBelow: false,
})

states.register(lowerGoal, {
  linkCount: 1,
  level: 3,
  promotionLevel: 3,
  couldBeALinkFromBelow: false,
})

states.register(reachable, {
  linkCount: 0,
  level: 3,
  promotionLevel: 3,
  couldBeALinkFromBelow: false,
})

states.register(orphan, {
  linkCount: 0,
  level: 3,
  promotionLevel: 3,
  couldBeALinkFromBelow: false,
})

goals.registerGoal(topGoal, 1)
goals.registerGoal(lowerGoal, 3)

const topEntry =
  stateStack.setTop(
    {},
    topGoal,
  )

stateStack.appendLower(
  topEntry,
  {},
  lowerGoal,
)

/*
 * This structural link keeps `reachable`
 * connected to the lower goal.
 */
const reachableWme =
  workingMemory.createElement(
    lowerGoal,
    attribute,
    reachable,
  )

/*
 * The orphan owns data but has no
 * incoming identifier link.
 */
const orphanWme =
  workingMemory.createElement(
    orphan,
    attribute,
    constant,
  )

workingMemory.scheduleAdd(reachableWme)
workingMemory.scheduleAdd(orphanWme)
workingMemory.applyBufferedChanges()

assert.equal(
  states.get(reachable).linkCount,
  1,
)

assert.equal(
  states.get(orphan).linkCount,
  0,
)

/*
 * Both identifiers are candidates for
 * demotion. The queue processor must
 * distinguish the disconnected orphan
 * from the still-reachable identifier.
 */
removals.addUnknownLevelIdentifier(
  reachable,
)

removals.addUnknownLevelIdentifier(
  orphan,
)

const processor =
  new AZDefaultIdentifierDemotionProcessor(
    queueProcessor,
    garbageCollector,
    marker,
    walker,
    removals,
    tcGenerator,
    stateStack,
    goals,
    states,
  )

processor.process()

/*
 * The reachable identifier is recovered
 * by the level walk from the lower goal.
 */
assert.equal(
  removals
    .getUnknownLevelIdentifiers()
    .includes(reachable),
  false,
)

assert.equal(
  states.get(reachable).level,
  3,
)

assert.equal(
  states.get(reachable).promotionLevel,
  3,
)

/*
 * The orphan was moved to the disconnected
 * queue and garbage-collected.
 * Removal from working memory is buffered.
 */
workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory
    .getElements()
    .includes(orphanWme),
  false,
)

assert.equal(
  workingMemory
    .getElements()
    .includes(reachableWme),
  true,
)

assert.equal(
  removals
    .getDisconnectedIdentifiers()
    .length,
  0,
)

assert.equal(
  removals
    .getUnknownLevelIdentifiers()
    .length,
  0,
)

console.log(
  'AZ autonomous identifier demotion processor: OK',
)
