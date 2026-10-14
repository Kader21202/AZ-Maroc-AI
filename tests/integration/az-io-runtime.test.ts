import assert from 'node:assert/strict'

import { AZIoRuntime } from '../../src/engines/cognitive/az/core/io/AZIoRuntime'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'

const symbols =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(
    symbols,
  )

const stack =
  new AZStateStack()

const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()

const events: string[] = []

const runtime =
  new AZIoRuntime(
    symbols,
    predefinedSymbols,
    stack,
    identifierStates,
    {
      handle(event) {
        events.push(event)
      },
    },
  )

const goal =
  symbols.makeIdentifier('S')


identifierStates.register(
  goal,
  {
    level: 1,
    promotionLevel: 1,
  },
)
stack.setTop(
  {},
  goal,
)

runtime.initialize(
  goal,
)

assert.notEqual(
  runtime.ioState.ioHeader,
  null,
)

assert.notEqual(
  runtime.ioState.inputLink,
  null,
)

assert.notEqual(
  runtime.ioState.outputLink,
  null,
)

runtime.inputPhase.execute()

assert.deepEqual(
  events,
  [
    'TOP_STATE_JUST_CREATED',
    'NORMAL_INPUT_CYCLE',
  ],
)

assert.equal(
  runtime.workingMemory
    .getElements()
    .length,
  3,
)

const command =
  symbols.makeIdentifier('C')

const commandAttribute =
  symbols.makeStringConstant(
    'command',
  )

const commandWme =
  runtime.workingMemory
    .createElement(
      runtime.ioState.outputLink!,
      commandAttribute,
      command,
    )

runtime.workingMemory.scheduleAdd(
  commandWme,
)

runtime.workingMemory.applyBufferedChanges()

const commands =
  runtime.outputPhase.execute(
    runtime.outputLinkManager,
  )

assert.equal(
  commands.length,
  1,
)

assert.equal(
  commands[0].mode,
  'ADDED',
)

assert.equal(
  commands[0].outputLink.linkWme,
  commandWme,
)

assert.equal(
  runtime.outputPhase.execute(
    runtime.outputLinkManager,
  ).length,
  0,
)

console.log(
  'AZ autonomous IO runtime: OK',
)


