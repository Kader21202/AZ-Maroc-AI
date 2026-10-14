import assert from 'node:assert/strict'

import {
  AZIoState,
} from '../../src/engines/cognitive/az/core/io/AZIoState'
import {
  AZOutputLinkManager,
} from '../../src/engines/cognitive/az/core/io/AZOutputLinkManager'
import {
  AZWorkingMemory,
} from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import {
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const ioState =
  new AZIoState()

const manager =
  new AZOutputLinkManager(
    ioState,
  )

const outputHeader =
  symbols.makeIdentifier('O')

const command =
  symbols.makeIdentifier('C')

const nested =
  symbols.makeIdentifier('N')

const deeper =
  symbols.makeIdentifier('D')

const attribute =
  symbols.makeStringConstant('command')

const childAttribute =
  symbols.makeStringConstant('child')

ioState.outputLink =
  outputHeader

const linkWme =
  workingMemory.createElement(
    outputHeader,
    attribute,
    command,
  )

workingMemory.scheduleAdd(linkWme)
workingMemory.applyBufferedChanges()

const outputLink =
  manager.postAddition(linkWme)

assert.notEqual(
  outputLink,
  null,
)

assert.equal(
  outputLink!.status,
  'NEW',
)

assert.equal(
  ioState.outputLinkChanged,
  true,
)

assert.equal(
  manager.getOutputLinks().length,
  1,
)

/*
 * Duplicate addition must return the same
 * logical output link.
 */
assert.equal(
  manager.postAddition(linkWme),
  outputLink,
)

assert.equal(
  manager.getOutputLinks().length,
  1,
)

/*
 * Initial transitive closure:
 *
 * command -> nested -> deeper
 */
const commandToNested =
  workingMemory.createElement(
    command,
    childAttribute,
    nested,
  )

const nestedToDeeper =
  workingMemory.createElement(
    nested,
    childAttribute,
    deeper,
  )

workingMemory.scheduleAdd(
  commandToNested,
)

workingMemory.scheduleAdd(
  nestedToDeeper,
)

workingMemory.applyBufferedChanges()

assert.equal(
  manager.refresh(
    outputLink!,
    workingMemory,
  ),
  true,
)

assert.deepEqual(
  outputLink!.idsInTc,
  [
    command,
    nested,
    deeper,
  ],
)

/*
 * NEW remains NEW until explicitly
 * processed.
 */
assert.equal(
  outputLink!.status,
  'NEW',
)

assert.equal(
  manager.markProcessed(
    outputLink!,
  ),
  true,
)

assert.equal(
  outputLink!.status,
  'UNCHANGED',
)

/*
 * Refreshing with the same closure changes
 * the status to MODIFIED_BUT_SAME_TC.
 */
assert.equal(
  manager.refresh(
    outputLink!,
    workingMemory,
  ),
  true,
)

assert.equal(
  outputLink!.status,
  'MODIFIED_BUT_SAME_TC',
)

manager.markProcessed(
  outputLink!,
)

/*
 * Add a new identifier to the transitive
 * closure. This must produce MODIFIED.
 */
const newest =
  symbols.makeIdentifier('X')

const deeperToNewest =
  workingMemory.createElement(
    deeper,
    childAttribute,
    newest,
  )

workingMemory.scheduleAdd(
  deeperToNewest,
)

workingMemory.applyBufferedChanges()

assert.equal(
  manager.refresh(
    outputLink!,
    workingMemory,
  ),
  true,
)

assert.equal(
  outputLink!.status,
  'MODIFIED',
)

assert.equal(
  outputLink!.idsInTc.includes(
    newest,
  ),
  true,
)

/*
 * A cycle in the output-link graph must terminate
 * without duplicating identifiers in the closure.
 *
 * command -> nested -> deeper -> command
 */
const backAttribute =
  symbols.makeStringConstant('back')

const cycleWme =
  workingMemory.createElement(
    deeper,
    backAttribute,
    command,
  )

workingMemory.scheduleAdd(
  cycleWme,
)

workingMemory.applyBufferedChanges()

manager.markProcessed(
  outputLink!,
)

assert.equal(
  manager.refresh(
    outputLink!,
    workingMemory,
  ),
  true,
)

assert.equal(
  outputLink!.idsInTc.filter(
    identifier => identifier === command,
  ).length,
  1,
)

assert.equal(
  outputLink!.idsInTc.filter(
    identifier => identifier === nested,
  ).length,
  1,
)

assert.equal(
  outputLink!.idsInTc.filter(
    identifier => identifier === deeper,
  ).length,
  1,
)

assert.equal(
  new Set(outputLink!.idsInTc).size,
  outputLink!.idsInTc.length,
)

/*
 * Removal is a two-step lifecycle:
 * mark REMOVED, then removeProcessed().
 */
assert.equal(
  manager.postRemoval(
    linkWme,
  ),
  true,
)

assert.equal(
  outputLink!.status,
  'REMOVED',
)

assert.equal(
  manager.refresh(
    outputLink!,
    workingMemory,
  ),
  false,
)

assert.equal(
  manager.markProcessed(
    outputLink!,
  ),
  false,
)

assert.equal(
  manager.removeProcessed(
    outputLink!,
  ),
  true,
)

assert.equal(
  manager.getOutputLinks().length,
  0,
)

/*
 * Once removed from the manager, the same
 * WME may be registered again as a new
 * logical output link.
 */
const replacement =
  manager.postAddition(
    linkWme,
  )

assert.notEqual(
  replacement,
  null,
)

assert.equal(
  replacement!.status,
  'NEW',
)

assert.notEqual(
  replacement,
  outputLink,
)

console.log(
  'AZ autonomous output-link manager: OK',
)

