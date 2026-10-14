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

let removedCount = 0

memory.setPropagation({
  onAdded() {},
  onRemoved() {
    removedCount += 1
  },
})

const wme = memory.createElement(source, attribute, target)

memory.scheduleAdd(wme)
memory.applyBufferedChanges()

assert.equal(states.get(target).linkCount, 1)

memory.scheduleRemove(wme)
memory.scheduleRemove(wme)

assert.equal(states.get(target).linkCount, 0, 'Double suppression : linkCount doit rester a zero')

memory.applyBufferedChanges()

assert.equal(
  removedCount,
  1,
  'Double suppression : une seule propagation attendue',
)

assert.equal(memory.getElements().length, 0)


const pending = memory.createElement(source, attribute, target)

memory.scheduleAdd(pending)
memory.scheduleRemove(pending)
memory.applyBufferedChanges()

assert.equal(
  memory.getElements().length,
  0,
  'Ajout puis suppression : aucun WME ne doit rester actif',
)

assert.equal(
  states.get(target).linkCount,
  0,
  'Ajout puis suppression : linkCount doit rester a zero',
)
console.log('AZ working-memory double removal: OK')
