import assert from 'node:assert/strict'

import { AZInputWmeManager } from '../../src/engines/cognitive/az/core/io/AZInputWmeManager'
import { AZInputWmeRegistry } from '../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZIoState } from '../../src/engines/cognitive/az/core/io/AZIoState'
import { AZIoStructureInitializer } from '../../src/engines/cognitive/az/core/io/AZIoStructureInitializer'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'

const symbols =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(
    symbols,
  )

const workingMemory =
  new AZWorkingMemory()


const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()
const registry =
  new AZInputWmeRegistry()

const manager =
  new AZInputWmeManager(
    workingMemory,
    registry,
  )

const ioState =
  new AZIoState()

const initializer =
  new AZIoStructureInitializer(
    symbols,
    predefinedSymbols,
    manager,
    identifierStates,
  )

const topGoal =
  symbols.makeIdentifier('S')


identifierStates.register(
  topGoal,
  {
    level: 1,
    promotionLevel: 1,
  },
)
initializer.initialize(
  topGoal,
  ioState,
)

assert.notEqual(
  ioState.ioHeader,
  null,
)

assert.notEqual(
  ioState.inputLink,
  null,
)

assert.notEqual(
  ioState.outputLink,
  null,
)

assert.notEqual(
  ioState.ioHeaderLink,
  null,
)

assert.equal(
  registry.get(topGoal).length,
  1,
)

assert.equal(
  registry.get(ioState.ioHeader!).length,
  2,
)

assert.equal(identifierStates.get(ioState.ioHeader!).level, identifierStates.get(topGoal).level)
assert.equal(identifierStates.get(ioState.inputLink!).level, identifierStates.get(topGoal).level)
assert.equal(identifierStates.get(ioState.outputLink!).level, identifierStates.get(topGoal).level)

assert.equal(registry.get(topGoal)[0]?.identifier, topGoal)
assert.equal(registry.get(topGoal)[0]?.attribute, predefinedSymbols.io)
assert.equal(registry.get(topGoal)[0]?.value, ioState.ioHeader)

const ioHeaderWmes = registry.get(ioState.ioHeader!)

assert.equal(
  ioHeaderWmes.some(wme =>
    wme.attribute === predefinedSymbols.inputLink &&
    wme.value === ioState.inputLink
  ),
  true,
)

assert.equal(
  ioHeaderWmes.some(wme =>
    wme.attribute === predefinedSymbols.outputLink &&
    wme.value === ioState.outputLink
  ),
  true,
)
workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().length,
  3,
)

assert.equal(
  workingMemory.getElements()[0].attribute,
  predefinedSymbols.io,
)

assert.equal(
  workingMemory.getElements()[1].attribute,
  predefinedSymbols.inputLink,
)

assert.equal(
  workingMemory.getElements()[2].attribute,
  predefinedSymbols.outputLink,
)

assert.throws(
  () =>
    initializer.initialize(
      topGoal,
      ioState,
    ),
  /already initialized/,
)

const headerLink =
  ioState.ioHeaderLink!

assert.equal(
  manager.remove(headerLink),
  true,
)

assert.equal(
  manager.remove(headerLink),
  false,
)

workingMemory.applyBufferedChanges()

assert.equal(
  registry.get(topGoal).length,
  0,
)

assert.equal(
  workingMemory.getElements().length,
  2,
)

console.log(
  'AZ autonomous IO structure: OK',
)



