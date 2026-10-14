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

const ioState =
  new AZIoState()

const manager =
  new AZOutputLinkManager(
    ioState,
  )

const workingMemory =
  new AZWorkingMemory(
    undefined,
    undefined,
    manager,
  )

const outputHeader =
  symbols.makeIdentifier('O')

const command =
  symbols.makeIdentifier('C')

const nested =
  symbols.makeIdentifier('N')

const outputAttribute =
  symbols.makeStringConstant('command')

const childAttribute =
  symbols.makeStringConstant('child')

ioState.outputLink =
  outputHeader

const outputWme =
  workingMemory.createElement(
    outputHeader,
    outputAttribute,
    command,
  )

/*
 * scheduleAdd() must automatically notify
 * the output-link manager.
 */
workingMemory.scheduleAdd(
  outputWme,
)

assert.equal(
  manager.getOutputLinks().length,
  1,
)

const outputLink =
  manager.getOutputLinks()[0]

assert.equal(
  outputLink.status,
  'NEW',
)

assert.equal(
  outputLink.linkWme,
  outputWme,
)

assert.equal(
  ioState.outputLinkChanged,
  true,
)

/*
 * applyBufferedChanges() must automatically
 * refresh the transitive closure.
 */
workingMemory.applyBufferedChanges()

assert.deepEqual(
  outputLink.idsInTc,
  [
    command,
  ],
)

manager.markProcessed(
  outputLink,
)

assert.equal(
  outputLink.status,
  'UNCHANGED',
)

ioState.outputLinkChanged =
  false

/*
 * A descendant added to working memory must
 * be detected through refreshAll().
 */
const childWme =
  workingMemory.createElement(
    command,
    childAttribute,
    nested,
  )

workingMemory.scheduleAdd(
  childWme,
)

workingMemory.applyBufferedChanges()

assert.equal(
  outputLink.status,
  'MODIFIED',
)

assert.deepEqual(
  outputLink.idsInTc,
  [
    command,
    nested,
  ],
)

assert.equal(
  ioState.outputLinkChanged,
  true,
)

manager.markProcessed(
  outputLink,
)

ioState.outputLinkChanged =
  false

const unrelated =
  symbols.makeIdentifier('U')

const unrelatedValue =
  symbols.makeIdentifier('V')

const unrelatedAttribute =
  symbols.makeStringConstant('unrelated')

const unrelatedWme =
  workingMemory.createElement(
    unrelated,
    unrelatedAttribute,
    unrelatedValue,
  )

workingMemory.scheduleAdd(
  unrelatedWme,
)

workingMemory.applyBufferedChanges()

assert.equal(
  outputLink.status,
  'UNCHANGED',
  'AZ invariant: a WM change outside an output-link TC must not modify that output link',
)

assert.equal(
  ioState.outputLinkChanged,
  false,
  'AZ invariant: an unrelated WM change must not report an output-link change',
)

const sameTcAttribute =
  symbols.makeStringConstant('same-tc')

const sameTcIdentifierWme =
  workingMemory.createElement(
    command,
    sameTcAttribute,
    nested,
  )

workingMemory.scheduleAdd(
  sameTcIdentifierWme,
)

workingMemory.applyBufferedChanges()

assert.equal(
  outputLink.status,
  'MODIFIED',
  'AZ invariant: an identifier-valued WM change inside an output-link TC must mark the link MODIFIED even when the identifier set is unchanged',
)
/*
 * scheduleRemove() must automatically notify
 * the manager before buffered removal is
 * applied.
 */
workingMemory.scheduleRemove(
  outputWme,
)

assert.equal(
  outputLink.status,
  'REMOVED',
)

assert.equal(
  ioState.outputLinkChanged,
  true,
)

workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory
    .getElements()
    .includes(outputWme),
  false,
)

assert.equal(
  manager.removeProcessed(
    outputLink,
  ),
  true,
)

assert.equal(
  manager.getOutputLinks().length,
  0,
)

console.log(
  'AZ working-memory output-link integration: OK',
)
