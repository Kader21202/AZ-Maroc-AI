import assert from 'node:assert/strict'

import {
  AZInputPhase,
} from '../../src/engines/cognitive/az/core/io/AZInputPhase'
import type {
  AZInputPhaseEvent,
} from '../../src/engines/cognitive/az/core/io/AZInputPhaseEvent'
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
  AZOutputPhase,
} from '../../src/engines/cognitive/az/core/phases/AZOutputPhase'
import {
  AZStateStack,
} from '../../src/engines/cognitive/az/core/state/AZStateStack'
import {
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const stateStack =
  new AZStateStack()

const ioState =
  new AZIoState()

const outputLinkManager =
  new AZOutputLinkManager(
    ioState,
  )

const workingMemory =
  new AZWorkingMemory(
    undefined,
    undefined,
    outputLinkManager,
  )

const events:
  AZInputPhaseEvent[] = []

const inputPhase =
  new AZInputPhase(
    stateStack,
    ioState,
    workingMemory,
    {
      handle(event) {
        events.push(event)
      },
    },
  )

/*
 * No top state:
 * no input event.
 */
inputPhase.execute()

assert.deepEqual(
  events,
  [],
)

/*
 * Create top state:
 * CREATED then NORMAL.
 */
const goal =
  symbols.makeIdentifier('S')

const top =
  stateStack.setTop(
    {},
    goal,
  )

inputPhase.execute()

assert.deepEqual(
  events,
  [
    'TOP_STATE_JUST_CREATED',
    'NORMAL_INPUT_CYCLE',
  ],
)

assert.equal(
  ioState.previousTopState,
  top,
)

/*
 * Stable top state:
 * NORMAL only.
 */
events.length = 0

inputPhase.execute()

assert.deepEqual(
  events,
  [
    'NORMAL_INPUT_CYCLE',
  ],
)

/*
 * Remove top state:
 * REMOVED.
 */
events.length = 0

stateStack.truncateFrom(
  goal,
)

inputPhase.execute()

assert.deepEqual(
  events,
  [
    'TOP_STATE_JUST_REMOVED',
  ],
)

assert.equal(
  ioState.previousTopState,
  null,
)

/*
 * Replace top state:
 * REMOVED then CREATED then NORMAL.
 * Input phase also flushes buffered WMEs and clears output-link change state.
 */
const firstReplacementGoal =
  symbols.makeIdentifier('S')

stateStack.setTop(
  {},
  firstReplacementGoal,
)

inputPhase.execute()

events.length = 0

const bufferedAttribute =
  symbols.makeStringConstant('status')

const bufferedValue =
  symbols.makeStringConstant('ready')

const bufferedWme =
  workingMemory.createElement(
    firstReplacementGoal,
    bufferedAttribute,
    bufferedValue,
  )

workingMemory.scheduleAdd(
  bufferedWme,
)

ioState.outputLinkChanged = true

stateStack.truncateFrom(
  firstReplacementGoal,
)

const secondReplacementGoal =
  symbols.makeIdentifier('S')

const secondReplacementTop =
  stateStack.setTop(
    {},
    secondReplacementGoal,
  )

inputPhase.execute()

assert.deepEqual(
  events,
  [
    'TOP_STATE_JUST_REMOVED',
    'TOP_STATE_JUST_CREATED',
    'NORMAL_INPUT_CYCLE',
  ],
)

assert.equal(
  ioState.previousTopState,
  secondReplacementTop,
)

assert.equal(
  ioState.outputLinkChanged,
  false,
)

assert.equal(
  workingMemory.getElements().includes(
    bufferedWme,
  ),
  true,
)

events.length = 0

stateStack.truncateFrom(
  secondReplacementGoal,
)

inputPhase.execute()

assert.deepEqual(
  events,
  [
    'TOP_STATE_JUST_REMOVED',
  ],
)

assert.equal(
  ioState.previousTopState,
  null,
)

/*
 * OUTPUT phase:
 * NEW -> ADDED -> UNCHANGED
 */
const outputHeader =
  symbols.makeIdentifier('O')

const command =
  symbols.makeIdentifier('C')

const commandAttribute =
  symbols.makeStringConstant('command')

ioState.outputLink =
  outputHeader

const outputWme =
  workingMemory.createElement(
    outputHeader,
    commandAttribute,
    command,
  )

workingMemory.scheduleAdd(
  outputWme,
)

workingMemory.applyBufferedChanges()

const outputPhase =
  new AZOutputPhase()

const added =
  outputPhase.execute(
    outputLinkManager,
  )

assert.equal(
  added.length,
  1,
)

assert.equal(
  added[0].mode,
  'ADDED',
)

assert.equal(
  added[0].outputLink.status,
  'UNCHANGED',
)

/*
 * No change:
 * no command.
 */
assert.equal(
  outputPhase.execute(
    outputLinkManager,
  ).length,
  0,
)

/*
 * Structural change:
 * MODIFIED command.
 */
const child =
  symbols.makeIdentifier('N')

const childAttribute =
  symbols.makeStringConstant('child')

workingMemory.scheduleAdd(
  workingMemory.createElement(
    command,
    childAttribute,
    child,
  ),
)

workingMemory.applyBufferedChanges()

const modified =
  outputPhase.execute(
    outputLinkManager,
  )

assert.equal(
  modified.length,
  1,
)

assert.equal(
  modified[0].mode,
  'MODIFIED',
)

assert.equal(
  modified[0].outputLink.status,
  'UNCHANGED',
)

/*
 * Removal:
 * REMOVED command and manager cleanup.
 */
workingMemory.scheduleRemove(
  outputWme,
)

const removed =
  outputPhase.execute(
    outputLinkManager,
  )

assert.equal(
  removed.length,
  1,
)

assert.equal(
  removed[0].mode,
  'REMOVED',
)

assert.equal(
  outputLinkManager
    .getOutputLinks()
    .length,
  0,
)

console.log(
  'AZ autonomous input/output phases: OK',
)


