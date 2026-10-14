import assert from 'node:assert/strict'

import { AZDefaultLinkAdditionProcessor } from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import { AZDefaultLinkRemovalProcessor } from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZDefaultImpasseStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const states = new AZDefaultIdentifierLinkStateRegistry()
const goals = new AZDefaultGoalStateRegistry()
const impasses = new AZDefaultImpasseStateRegistry()

const memory = new AZWorkingMemory(
  new AZDefaultLinkAdditionProcessor(states, goals, impasses),
  new AZDefaultLinkRemovalProcessor(states, goals, impasses),
)

const source = symbols.makeIdentifier('S')
const target = symbols.makeIdentifier('T')
const attribute = symbols.makeStringConstant('episode')

states.register(source, { level: 1, promotionLevel: 1 })
states.register(target, { level: 1, promotionLevel: 1 })

const wme = memory.createElement(source, attribute, target)

memory.scheduleAdd(wme)

assert.equal(states.get(target).linkCount, 1)

memory.scheduleRemove(wme)

assert.equal(states.get(target).linkCount, 0)

memory.applyBufferedChanges()

assert.equal(memory.getElements().length, 0)
assert.equal(states.get(target).linkCount, 0)

console.log('AZ add/remove same buffer: OK')
