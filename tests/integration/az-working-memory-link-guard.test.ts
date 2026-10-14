import assert from 'node:assert/strict'

import {
  AZDefaultLinkAdditionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import {
  AZDefaultLinkRemovalProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
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
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()

const states =
  new AZDefaultIdentifierLinkStateRegistry()

const goals =
  new AZDefaultGoalStateRegistry()

const impasses =
  new AZDefaultImpasseStateRegistry()

const additions =
  new AZDefaultLinkAdditionProcessor(
    states,
    goals,
    impasses,
  )

const removals =
  new AZDefaultLinkRemovalProcessor(
    states,
    goals,
    impasses,
  )

const workingMemory =
  new AZWorkingMemory(
    additions,
    removals,
  )

const nonIdentifierSource =
  symbols.makeStringConstant('source')

const identifierTarget =
  symbols.makeIdentifier('T')

const attribute =
  symbols.makeStringConstant('child')

states.register(identifierTarget, {
  level: 1,
  promotionLevel: 1,
})

const wme =
  workingMemory.createElement(
    nonIdentifierSource,
    attribute,
    identifierTarget,
  )

workingMemory.scheduleAdd(wme)

assert.equal(
  states.get(identifierTarget).linkCount,
  0,
)

workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().includes(wme),
  true,
)

workingMemory.scheduleRemove(wme)

assert.equal(
  states.get(identifierTarget).linkCount,
  0,
)

workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().includes(wme),
  false,
)

console.log(
  'AZ working-memory identifier-link guard: OK',
)
